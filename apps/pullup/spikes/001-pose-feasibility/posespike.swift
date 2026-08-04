// posespike.swift — feasibility spike for the pullup app.
// Decodes a video with AVFoundation and runs VNDetectHumanBodyPoseRequest per frame.
// Emits a per-frame CSV of joint confidence + normalized (x,y) for the joints that matter.
//
// Build:  swiftc -O posespike.swift -o posespike
// Run:    ./posespike <video.mp4> [everyNthFrame]
// Output: CSV to stdout. Redirect to a file.
//
// Vision normalized coords: origin bottom-left, y up, in [0,1].

import Foundation
import AVFoundation
import Vision
import CoreImage

guard CommandLine.arguments.count >= 2 else {
    FileHandle.standardError.write("usage: posespike <video.mp4> [stride]\n".data(using: .utf8)!)
    exit(2)
}
let path = CommandLine.arguments[1]
let stride = CommandLine.arguments.count >= 3 ? Int(CommandLine.arguments[2]) ?? 1 : 1

let url = URL(fileURLWithPath: path)
let asset = AVURLAsset(url: url)

// Load track + duration synchronously (spike; fine to block).
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

// Joints we care about for pullup ROM / chin-over-bar / form.
let jointsOfInterest: [(String, VNHumanBodyPoseObservation.JointName)] = [
    ("nose",  .nose),
    ("lSho",  .leftShoulder),  ("rSho",  .rightShoulder),
    ("lElb",  .leftElbow),     ("rElb",  .rightElbow),
    ("lWri",  .leftWrist),     ("rWri",  .rightWrist),
    ("lHip",  .leftHip),       ("rHip",  .rightHip),
]

// CSV header
var header = "frame,t_sec,total_joints"
for (name, _) in jointsOfInterest { header += ",\(name)_conf,\(name)_x,\(name)_y" }
print(header)

FileHandle.standardError.write("video: \(path)  dur=\(String(format: "%.2f", durationSeconds))s  fps=\(nominalFPS)  stride=\(stride)\n".data(using: .utf8)!)

let requestHandlerQueue = DispatchQueue(label: "vision")
var frameIndex = -1
var processed = 0

while let sample = trackOutput.copyNextSampleBuffer() {
    frameIndex += 1
    if frameIndex % stride != 0 { continue }
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sample) else { continue }
    let t = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample))

    let request = VNDetectHumanBodyPoseRequest()
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: [:])
    do { try handler.perform([request]) } catch { continue }

    let observations = request.results ?? []
    // Pick the observation with the most recognized points (main subject).
    let best = observations.max(by: { ($0.availableJointNames.count) < ($1.availableJointNames.count) })

    var row = "\(frameIndex),\(String(format: "%.3f", t))"
    if let obs = best, let points = try? obs.recognizedPoints(.all) {
        let totalConfident = points.values.filter { $0.confidence > 0.0 }.count
        row += ",\(totalConfident)"
        for (_, jn) in jointsOfInterest {
            if let p = points[jn] {
                row += ",\(String(format: "%.3f", p.confidence)),\(String(format: "%.4f", p.location.x)),\(String(format: "%.4f", p.location.y))"
            } else {
                row += ",0.000,-1,-1"
            }
        }
    } else {
        row += ",0"
        for _ in jointsOfInterest { row += ",0.000,-1,-1" }
    }
    print(row)
    processed += 1
}

FileHandle.standardError.write("processed \(processed) frames (of \(frameIndex + 1) total)\n".data(using: .utf8)!)
if reader.status == .failed { FileHandle.standardError.write("reader failed: \(String(describing: reader.error))\n".data(using: .utf8)!) }
