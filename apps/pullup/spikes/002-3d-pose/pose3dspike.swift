// pose3dspike.swift — feasibility spike 002 for the pullup app (3D pose).
// Decodes a video with AVFoundation and runs VNDetectHumanBodyPose3DRequest per frame.
// Emits a per-frame CSV of 3D joint positions (meters, relative to root) for the
// joints that matter for pullup ROM / chin-over-bar / form — with NO reliance on
// the face being visible.
//
// Build:  swiftc -O pose3dspike.swift -o pose3dspike
// Run:    ./pose3dspike <video> [stride] [orientation up|right|left|down] [maxSeconds]
// Output: CSV to stdout. Redirect to a file. Diagnostics to stderr.

import Foundation
import AVFoundation
import Vision
import CoreImage
import simd

guard CommandLine.arguments.count >= 2 else {
    FileHandle.standardError.write("usage: pose3dspike <video> [stride] [orientation] [maxSeconds]\n".data(using: .utf8)!)
    exit(2)
}
let path = CommandLine.arguments[1]
let stride = CommandLine.arguments.count >= 3 ? Int(CommandLine.arguments[2]) ?? 1 : 1
let orientArg = CommandLine.arguments.count >= 4 ? CommandLine.arguments[3] : "up"
let maxSeconds = CommandLine.arguments.count >= 5 ? Double(CommandLine.arguments[4]) ?? 1e9 : 1e9

let orientation: CGImagePropertyOrientation = {
    switch orientArg {
    case "right": return .right
    case "left":  return .left
    case "down":  return .down
    default:      return .up
    }
}()

let url = URL(fileURLWithPath: path)
let asset = AVURLAsset(url: url)

let sem = DispatchSemaphore(value: 0)
var videoTrack: AVAssetTrack?
var durationSeconds = 0.0
var nominalFPS: Float = 0
Task {
    if let t = try? await asset.loadTracks(withMediaType: .video).first {
        videoTrack = t
        if let d = try? await asset.load(.duration) { durationSeconds = CMTimeGetSeconds(d) }
        if let f = try? await t.load(.nominalFrameRate) { nominalFPS = f }
    }
    sem.signal()
}
sem.wait()

guard let track = videoTrack else {
    FileHandle.standardError.write("no video track\n".data(using: .utf8)!); exit(1)
}

let reader = try AVAssetReader(asset: asset)
let outputSettings: [String: Any] = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
let trackOutput = AVAssetReaderTrackOutput(track: track, outputSettings: outputSettings)
trackOutput.alwaysCopiesSampleData = false
reader.add(trackOutput)
reader.startReading()

// 3D joints we care about. Names per VNHumanBodyPose3DObservation.JointName.
let jointsOfInterest: [(String, VNHumanBodyPose3DObservation.JointName)] = [
    ("head",  .centerHead),
    ("cSho",  .centerShoulder),
    ("lSho",  .leftShoulder),  ("rSho",  .rightShoulder),
    ("lElb",  .leftElbow),     ("rElb",  .rightElbow),
    ("lWri",  .leftWrist),     ("rWri",  .rightWrist),
    ("lHip",  .leftHip),       ("rHip",  .rightHip),
    ("root",  .root),
]

// CSV header: per joint -> present(0/1), x, y, z  (meters, model space relative to root)
var header = "frame,t_sec,has_obs,n_joints,bodyHeight"
for (name, _) in jointsOfInterest { header += ",\(name)_p,\(name)_x,\(name)_y,\(name)_z" }
print(header)

FileHandle.standardError.write("video: \(path)  dur=\(String(format: "%.2f", durationSeconds))s  fps=\(nominalFPS)  stride=\(stride)  orient=\(orientArg)  maxSec=\(maxSeconds)\n".data(using: .utf8)!)

// Extract the translation (position) from a 3D recognized point.
// VNHumanBodyRecognizedPoint3D.position is a simd_float4x4; translation = column 3.
func translation(_ m: simd_float4x4) -> SIMD3<Float> {
    return SIMD3<Float>(m.columns.3.x, m.columns.3.y, m.columns.3.z)
}

var frameIndex = -1
var processed = 0

while let sample = trackOutput.copyNextSampleBuffer() {
    frameIndex += 1
    if frameIndex % stride != 0 { continue }
    let t = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample))
    if t > maxSeconds { break }
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sample) else { continue }

    let request = VNDetectHumanBodyPose3DRequest()
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])
    do { try handler.perform([request]) } catch {
        // no observation for this frame
        var row = "\(frameIndex),\(String(format: "%.3f", t)),0,0,0"
        for _ in jointsOfInterest { row += ",0,0,0,0" }
        print(row); processed += 1; continue
    }

    let observations = (request.results ?? []) as [VNHumanBodyPose3DObservation]
    guard let obs = observations.first else {
        var row = "\(frameIndex),\(String(format: "%.3f", t)),0,0,0"
        for _ in jointsOfInterest { row += ",0,0,0,0" }
        print(row); processed += 1; continue
    }

    let bodyHeight = obs.bodyHeight
    var jointCols = ""
    var nPresent = 0
    for (_, jn) in jointsOfInterest {
        if let p = try? obs.recognizedPoint(jn) {
            let pos = translation(p.position)
            jointCols += ",1,\(String(format: "%.4f", pos.x)),\(String(format: "%.4f", pos.y)),\(String(format: "%.4f", pos.z))"
            nPresent += 1
        } else {
            jointCols += ",0,0,0,0"
        }
    }
    let row = "\(frameIndex),\(String(format: "%.3f", t)),1,\(nPresent),\(String(format: "%.4f", bodyHeight))" + jointCols
    print(row)
    processed += 1
}

FileHandle.standardError.write("processed \(processed) frames (of \(frameIndex + 1) total)\n".data(using: .utf8)!)
if reader.status == .failed { FileHandle.standardError.write("reader failed: \(String(describing: reader.error))\n".data(using: .utf8)!) }
