import AVFoundation
import ExpoModulesCore

struct StartOptions: Record {
  @Field var facing: String = "front"
  @Field var fps: Int = 30
}

/// Expo module surface. Kept tiny: permissions, start/stop, one event stream, one view.
public class AppleVisionPoseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleVisionPose")

    Events("onPose", "onError")

    OnCreate {
      PoseCaptureSession.shared.onPose = { [weak self] payload in
        self?.sendEvent("onPose", payload)
      }
      PoseCaptureSession.shared.onError = { [weak self] message in
        self?.sendEvent("onError", ["message": message])
      }
    }

    OnDestroy {
      PoseCaptureSession.shared.stop()
    }

    Function("isAvailable") { () -> Bool in
      AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) != nil
        || AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil
    }

    Function("getPermission") { () -> String in
      Self.describe(AVCaptureDevice.authorizationStatus(for: .video))
    }

    AsyncFunction("requestPermission") { (promise: Promise) in
      let status = AVCaptureDevice.authorizationStatus(for: .video)
      if status == .notDetermined {
        AVCaptureDevice.requestAccess(for: .video) { granted in
          promise.resolve(granted ? "granted" : "denied")
        }
      } else {
        promise.resolve(Self.describe(status))
      }
    }

    AsyncFunction("start") { (options: StartOptions) in
      try PoseCaptureSession.shared.start(facing: options.facing, targetFps: options.fps)
    }

    AsyncFunction("stop") {
      PoseCaptureSession.shared.stop()
    }

    View(PosePreviewView.self) {}
  }

  private static func describe(_ status: AVAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    case .denied, .restricted: return "denied"
    case .notDetermined: return "undetermined"
    @unknown default: return "undetermined"
    }
  }
}
