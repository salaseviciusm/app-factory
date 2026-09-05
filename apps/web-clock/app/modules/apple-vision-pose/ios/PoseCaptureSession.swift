import AVFoundation
import Vision

/// Joint order is the contract with JS (see src/domain/pose/pose-frame.ts JOINTS).
private let jointNames: [(String, VNHumanBodyPoseObservation.JointName)] = [
  ("nose", .nose),
  ("leftEye", .leftEye),
  ("rightEye", .rightEye),
  ("leftEar", .leftEar),
  ("rightEar", .rightEar),
  ("neck", .neck),
  ("leftShoulder", .leftShoulder),
  ("rightShoulder", .rightShoulder),
  ("leftElbow", .leftElbow),
  ("rightElbow", .rightElbow),
  ("leftWrist", .leftWrist),
  ("rightWrist", .rightWrist),
  ("leftHip", .leftHip),
  ("rightHip", .rightHip),
  ("root", .root),
  ("leftKnee", .leftKnee),
  ("rightKnee", .rightKnee),
  ("leftAnkle", .leftAnkle),
  ("rightAnkle", .rightAnkle),
]

enum PoseCaptureError: Error, LocalizedError {
  case noCamera
  case cannotAddInput
  case cannotAddOutput

  var errorDescription: String? {
    switch self {
    case .noCamera: return "No camera available for the requested position"
    case .cannotAddInput: return "Could not attach the camera to the capture session"
    case .cannotAddOutput: return "Could not attach the video output to the capture session"
    }
  }
}

/// Owns the camera and the Vision request. One instance per process: the preview
/// view attaches to `captureSession`, the module drives start/stop and receives poses.
final class PoseCaptureSession: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  static let shared = PoseCaptureSession()

  let captureSession = AVCaptureSession()

  /// Called on the vision queue with a JS-ready payload.
  var onPose: (([String: Any]) -> Void)?
  var onError: ((String) -> Void)?

  private let sessionQueue = DispatchQueue(label: "suitup.pose.session")
  private let visionQueue = DispatchQueue(label: "suitup.pose.vision", qos: .userInteractive)
  private let output = AVCaptureVideoDataOutput()
  private var input: AVCaptureDeviceInput?
  private var frameIndex = 0
  private var stride = 1
  private var facing: AVCaptureDevice.Position = .front
  private let request = VNDetectHumanBodyPoseRequest()

  private override init() {
    super.init()
  }

  func start(facing: String, targetFps: Int) throws {
    try sessionQueue.sync {
      let position: AVCaptureDevice.Position = facing == "back" ? .back : .front
      if captureSession.isRunning && position == self.facing {
        return
      }
      self.facing = position
      captureSession.beginConfiguration()
      defer { captureSession.commitConfiguration() }
      captureSession.sessionPreset = .hd1280x720

      if let existing = input {
        captureSession.removeInput(existing)
        input = nil
      }
      guard
        let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
      else {
        throw PoseCaptureError.noCamera
      }
      let deviceInput = try AVCaptureDeviceInput(device: device)
      guard captureSession.canAddInput(deviceInput) else { throw PoseCaptureError.cannotAddInput }
      captureSession.addInput(deviceInput)
      input = deviceInput

      // Vision is comfortable at 30 fps on modern hardware; anything faster is wasted.
      try? device.lockForConfiguration()
      let fps = max(15, min(30, targetFps))
      device.activeVideoMinFrameDuration = CMTime(value: 1, timescale: CMTimeScale(fps))
      device.activeVideoMaxFrameDuration = CMTime(value: 1, timescale: CMTimeScale(fps))
      device.unlockForConfiguration()

      if !captureSession.outputs.contains(output) {
        output.alwaysDiscardsLateVideoFrames = true
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        output.setSampleBufferDelegate(self, queue: visionQueue)
        guard captureSession.canAddOutput(output) else { throw PoseCaptureError.cannotAddOutput }
        captureSession.addOutput(output)
      }

      // Portrait buffers, mirrored for the front camera so keypoints line up with
      // what the athlete sees in the (automatically mirrored) preview.
      if let connection = output.connection(with: .video) {
        if connection.isVideoRotationAngleSupported(90) {
          connection.videoRotationAngle = 90
        }
        if connection.isVideoMirroringSupported {
          connection.automaticallyAdjustsVideoMirroring = false
          connection.isVideoMirrored = position == .front
        }
      }
      frameIndex = 0
    }
    sessionQueue.async { [captureSession] in
      if !captureSession.isRunning {
        captureSession.startRunning()
      }
    }
  }

  func stop() {
    sessionQueue.async { [captureSession] in
      if captureSession.isRunning {
        captureSession.stopRunning()
      }
    }
  }

  // MARK: AVCaptureVideoDataOutputSampleBufferDelegate

  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    frameIndex += 1
    if stride > 1 && frameIndex % stride != 0 {
      return
    }
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    let tMs = Int(CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer)) * 1000)
    let width = CVPixelBufferGetWidth(pixelBuffer)
    let height = CVPixelBufferGetHeight(pixelBuffer)

    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: [:])
    do {
      try handler.perform([request])
    } catch {
      onError?("vision: \(error.localizedDescription)")
      return
    }

    // The athlete is the observation with the most recognized joints.
    let best = (request.results ?? []).max { a, b in
      a.availableJointNames.count < b.availableJointNames.count
    }
    var joints: [String: [Double]] = [:]
    if let observation = best, let points = try? observation.recognizedPoints(.all) {
      for (name, jointName) in jointNames {
        guard let point = points[jointName], point.confidence > 0 else { continue }
        // Vision: origin bottom-left, y up. JS: origin top-left, y down.
        joints[name] = [
          round3(Double(point.location.x)),
          round3(1 - Double(point.location.y)),
          round3(Double(point.confidence)),
        ]
      }
    }
    onPose?(["tMs": tMs, "width": width, "height": height, "joints": joints])
  }

  private func round3(_ value: Double) -> Double {
    (value * 1000).rounded() / 1000
  }
}
