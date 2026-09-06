// pose-extract.swift — run Apple Vision body pose over a video file and emit per-frame
// keypoints as CSV, in the layout tools/csv-to-fixture.mjs consumes. Same engine the
// app uses (VNDetectHumanBodyPoseRequest), so what counts here counts on the phone.
//
// Build (macOS, Xcode installed):  xcrun swiftc -O tools/pose-extract.swift -o pose-extract
// Run:                             ./pose-extract clip.mov [stride] > clip.csv
// Then:                            node tools/csv-to-fixture.mjs clip.csv fixtures/<move>/<name>.json --label "..."
//
// Vision normalized coords: origin bottom-left, y up. csv-to-fixture flips y.

import AVFoundation
import CoreImage
import Foundation
import Vision

guard CommandLine.arguments.count >= 2 else {
  FileHandle.standardError.write("usage: pose-extract <video> [stride]\n".data(using: .utf8)!)
  exit(2)
}
let path = CommandLine.arguments[1]
let stride = CommandLine.arguments.count >= 3 ? Int(CommandLine.arguments[2]) ?? 1 : 1

let asset = AVURLAsset(url: URL(fileURLWithPath: path))
let semaphore = DispatchSemaphore(value: 0)
var videoTrack: AVAssetTrack?
var preferredTransform = CGAffineTransform.identity
var naturalSize = CGSize.zero
Task {
  if let track = try? await asset.loadTracks(withMediaType: .video).first {
    videoTrack = track
    if let t = try? await track.load(.preferredTransform) { preferredTransform = t }
    if let s = try? await track.load(.naturalSize) { naturalSize = s }
  }
  semaphore.signal()
}
semaphore.wait()

guard let track = videoTrack else {
  FileHandle.standardError.write("no video track\n".data(using: .utf8)!)
  exit(1)
}

// Phone footage is stored landscape with a rotation transform; tell Vision which way is up.
func orientation(for transform: CGAffineTransform) -> CGImagePropertyOrientation {
  switch (transform.a, transform.b, transform.c, transform.d) {
  case (0, 1, -1, 0): return .right
  case (0, -1, 1, 0): return .left
  case (-1, 0, 0, -1): return .down
  default: return .up
  }
}
let imageOrientation = orientation(for: preferredTransform)
// Size as displayed (after rotation) — pass to csv-to-fixture as --size WxH.
let displaySize = naturalSize.applying(preferredTransform)
let sizeArg = "\(Int(abs(displaySize.width)))x\(Int(abs(displaySize.height)))"
FileHandle.standardError.write("size \(sizeArg) (orientation \(imageOrientation.rawValue))\n".data(using: .utf8)!)

let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(
  track: track,
  outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
output.alwaysCopiesSampleData = false
reader.add(output)
reader.startReading()

let joints: [(String, VNHumanBodyPoseObservation.JointName)] = [
  ("nose", .nose), ("neck", .neck),
  ("lSho", .leftShoulder), ("rSho", .rightShoulder),
  ("lElb", .leftElbow), ("rElb", .rightElbow),
  ("lWri", .leftWrist), ("rWri", .rightWrist),
  ("lHip", .leftHip), ("rHip", .rightHip),
  ("lKne", .leftKnee), ("rKne", .rightKnee),
  ("lAnk", .leftAnkle), ("rAnk", .rightAnkle),
]

var header = "frame,t_sec,total_joints"
for (name, _) in joints { header += ",\(name)_conf,\(name)_x,\(name)_y" }
print(header)

let request = VNDetectHumanBodyPoseRequest()
var frameIndex = -1
var processed = 0

while let sample = output.copyNextSampleBuffer() {
  frameIndex += 1
  if frameIndex % stride != 0 { continue }
  guard let pixelBuffer = CMSampleBufferGetImageBuffer(sample) else { continue }
  let t = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample))
  let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: imageOrientation, options: [:])
  do { try handler.perform([request]) } catch { continue }

  let best = (request.results ?? []).max { $0.availableJointNames.count < $1.availableJointNames.count }
  var row = "\(frameIndex),\(String(format: "%.3f", t))"
  if let observation = best, let points = try? observation.recognizedPoints(.all) {
    row += ",\(points.values.filter { $0.confidence > 0 }.count)"
    for (_, joint) in joints {
      if let p = points[joint], p.confidence > 0 {
        row += ",\(String(format: "%.3f", p.confidence)),\(String(format: "%.4f", p.location.x)),\(String(format: "%.4f", p.location.y))"
      } else {
        row += ",0.000,-1,-1"
      }
    }
  } else {
    row += ",0"
    for _ in joints { row += ",0.000,-1,-1" }
  }
  print(row)
  processed += 1
}

FileHandle.standardError.write("processed \(processed) of \(frameIndex + 1) frames; next: node tools/csv-to-fixture.mjs <csv> <json> --size \(sizeArg)\n".data(using: .utf8)!)
if reader.status == .failed {
  FileHandle.standardError.write("reader failed: \(String(describing: reader.error))\n".data(using: .utf8)!)
  exit(1)
}
