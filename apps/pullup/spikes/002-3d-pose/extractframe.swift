import Foundation
import AVFoundation
import AppKit
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
for ts in a[3...] {
  let t = CMTime(seconds: Double(ts)!, preferredTimescale: 600)
  if let cg = try? gen.copyCGImage(at: t, actualTime: nil) {
    let rep = NSBitmapImageRep(cgImage: cg)
    let png = rep.representation(using: .png, properties: [:])!
    let out = "\(a[2])_\(ts)s.png"
    try! png.write(to: URL(fileURLWithPath: out))
    print("wrote \(out) \(cg.width)x\(cg.height)")
  } else { print("fail at \(ts)s") }
}
