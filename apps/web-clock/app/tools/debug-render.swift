// Suit Up — debug video renderer (macOS). Same job as skip-hero's debug-render:
// burn the skeleton, posture, per-move counts/rejects, and an elbow/knee strip
// onto a copy of the source clip. The input video is never modified.
//
//   debug-render <video> <fixture.json> <trace.json> <out.mov>
//                [--preview <seconds> <preview.png>]
//                [--from <sec>] [--to <sec>]
//
// Fixture coords are normalized top-left y-down (csv-to-fixture). Frames are
// stood upright from the track transform before overlays are drawn.

import AVFoundation
import CoreImage
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

func orientation(from transform: CGAffineTransform) -> CGImagePropertyOrientation {
  switch (transform.a, transform.b, transform.c, transform.d) {
  case (0, 1, -1, 0): return .right
  case (0, -1, 1, 0): return .left
  case (-1, 0, 0, -1): return .down
  default: return .up
  }
}

var args = Array(CommandLine.arguments.dropFirst())
var previewSeconds: Double?
var previewURL: URL?
if let i = args.firstIndex(of: "--preview"), args.count > i + 2 {
  previewSeconds = Double(args[i + 1])
  previewURL = URL(fileURLWithPath: args[i + 2])
  args.removeSubrange(i...(i + 2))
}
var fromSec = 0.0
var toSec = Double.infinity
if let i = args.firstIndex(of: "--from"), args.count > i + 1 {
  fromSec = Double(args[i + 1]) ?? 0
  args.removeSubrange(i...(i + 1))
}
if let i = args.firstIndex(of: "--to"), args.count > i + 1 {
  toSec = Double(args[i + 1]) ?? .infinity
  args.removeSubrange(i...(i + 1))
}
guard args.count == 4 else {
  FileHandle.standardError.write(
    Data(
      "usage: debug-render <video> <fixture.json> <trace.json> <out.mov> [--preview s png] [--from s] [--to s]\n"
        .utf8))
  exit(1)
}

let videoURL = URL(fileURLWithPath: args[0])
let fixtureURL = URL(fileURLWithPath: args[1])
let traceURL = URL(fileURLWithPath: args[2])
let outputURL = URL(fileURLWithPath: args[3])

struct Joint {
  let x: Double
  let y: Double
  let c: Double
}

struct RecFrame {
  let t: Double
  let body: [String: Joint]
}

struct MoveState {
  let count: Int
  let phase: String
  let signal: Double?
}

struct TraceEvent {
  let move: String
  let kind: String
  let reason: String?
}

struct TraceFrame {
  let t: Double
  let posture: String
  let tilt: Double?
  let wristAbove: Double?
  let elbow: Double?
  let knee: Double?
  let coverage: Double
  let states: [String: MoveState]
  let events: [TraceEvent]
}

func loadJSON(_ url: URL) throws -> [String: Any] {
  let data = try Data(contentsOf: url)
  guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
    throw NSError(
      domain: "debug-render", code: 1,
      userInfo: [NSLocalizedDescriptionKey: "not a JSON object: \(url.path)"])
  }
  return object
}

func number(_ raw: Any?) -> Double? {
  if let n = raw as? Double { return n }
  if let n = raw as? Int { return Double(n) }
  return nil
}

let fixtureJSON = try loadJSON(fixtureURL)
let traceJSON = try loadJSON(traceURL)
let originMs = (number((fixtureJSON["window"] as? [String: Any])?["fromSec"]) ?? 0) * 1000

let recFrames: [RecFrame] = (fixtureJSON["frames"] as? [[String: Any]] ?? []).map { raw in
  var body: [String: Joint] = [:]
  for (name, value) in raw["j"] as? [String: Any] ?? [:] {
    guard let arr = value as? [Any], arr.count >= 3,
      let x = number(arr[0]), let y = number(arr[1]), let c = number(arr[2])
    else { continue }
    body[name] = Joint(x: x, y: y, c: c)
  }
  return RecFrame(t: (number(raw["t"]) ?? 0) + originMs, body: body)
}

func moveState(_ raw: [String: Any]?) -> MoveState {
  MoveState(
    count: Int(number(raw?["count"]) ?? 0),
    phase: raw?["phase"] as? String ?? "unknown",
    signal: number(raw?["signal"]))
}

let traceFrames: [TraceFrame] = (traceJSON["frames"] as? [[String: Any]] ?? []).map { raw in
  let events = (raw["events"] as? [[String: Any]] ?? []).map {
    TraceEvent(
      move: $0["move"] as? String ?? "",
      kind: $0["kind"] as? String ?? "",
      reason: $0["reason"] as? String)
  }
  return TraceFrame(
    t: (number(raw["t"]) ?? 0) + originMs,
    posture: raw["posture"] as? String ?? "unknown",
    tilt: number(raw["tilt"]),
    wristAbove: number(raw["wristAbove"]),
    elbow: number(raw["elbow"]),
    knee: number(raw["knee"]),
    coverage: number(raw["coverage"]) ?? 0,
    states: [
      "pullup": moveState(raw["pullup"] as? [String: Any]),
      "pushup": moveState(raw["pushup"] as? [String: Any]),
      "squat": moveState(raw["squat"] as? [String: Any]),
      "row": moveState(raw["row"] as? [String: Any]),
    ],
    events: events)
}

let posed = recFrames.filter { !$0.body.isEmpty }.count
FileHandle.standardError.write(
  Data("loaded: \(recFrames.count) pose frames (\(posed) with joints), \(traceFrames.count) trace frames\n".utf8))

let bones: [(String, String)] = [
  ("leftShoulder", "rightShoulder"),
  ("leftShoulder", "leftElbow"), ("leftElbow", "leftWrist"),
  ("rightShoulder", "rightElbow"), ("rightElbow", "rightWrist"),
  ("leftShoulder", "leftHip"), ("rightShoulder", "rightHip"),
  ("leftHip", "rightHip"),
  ("leftHip", "leftKnee"), ("leftKnee", "leftAnkle"),
  ("rightHip", "rightKnee"), ("rightKnee", "rightAnkle"),
  ("neck", "nose"),
]

func confidenceColor(_ c: Double) -> CGColor {
  if c >= 0.5 { return CGColor(red: 0.15, green: 0.95, blue: 0.45, alpha: 0.95) }
  if c >= 0.3 { return CGColor(red: 1.0, green: 0.75, blue: 0.1, alpha: 0.95) }
  return CGColor(red: 1.0, green: 0.25, blue: 0.2, alpha: 0.9)
}

func postureColor(_ posture: String) -> CGColor {
  switch posture {
  case "hang": return CGColor(red: 0.35, green: 0.85, blue: 1.0, alpha: 1)
  case "plank": return CGColor(red: 1.0, green: 0.62, blue: 0.2, alpha: 1)
  case "supine": return CGColor(red: 0.85, green: 0.45, blue: 1.0, alpha: 1)
  case "stand": return CGColor(red: 0.95, green: 0.95, blue: 0.95, alpha: 1)
  default: return CGColor(red: 0.65, green: 0.65, blue: 0.65, alpha: 1)
  }
}

func drawText(
  _ ctx: CGContext, _ text: String, x: CGFloat, top: CGFloat, size: CGFloat,
  color: CGColor, bold: Bool = true, centered: Bool = false
) {
  let font = CTFontCreateWithName((bold ? "HelveticaNeue-Bold" : "HelveticaNeue") as CFString, size, nil)
  let attributes: [CFString: Any] = [
    kCTFontAttributeName: font,
    kCTForegroundColorAttributeName: color,
  ]
  let attributed = CFAttributedStringCreate(nil, text as CFString, attributes as CFDictionary)!
  let line = CTLineCreateWithAttributedString(attributed)
  var ascent: CGFloat = 0
  let width = CGFloat(CTLineGetTypographicBounds(line, &ascent, nil, nil))
  ctx.saveGState()
  ctx.textMatrix = CGAffineTransform(scaleX: 1, y: -1)
  ctx.textPosition = CGPoint(x: centered ? x - width / 2 : x, y: top + ascent)
  CTLineDraw(line, ctx)
  ctx.restoreGState()
}

func strokeSeries(
  _ ctx: CGContext, _ frames: [TraceFrame],
  value: (TraceFrame) -> Double?,
  mapX: (Double) -> CGFloat, mapY: (Double) -> CGFloat,
  clip: CGRect, color: CGColor, width: CGFloat
) {
  ctx.setStrokeColor(color)
  ctx.setLineWidth(width)
  ctx.setLineJoin(.round)
  ctx.setLineCap(.round)
  var started = false
  for f in frames {
    guard let v = value(f) else {
      started = false
      continue
    }
    let point = CGPoint(x: mapX(f.t), y: min(max(mapY(v), clip.minY), clip.maxY))
    if started { ctx.addLine(to: point) } else { ctx.move(to: point) }
    started = true
  }
  ctx.strokePath()
}

func nearest<T>(t: Double, frames: [T], last: inout Int, time: (T) -> Double) -> T? {
  guard !frames.isEmpty else { return nil }
  if last >= frames.count { last = frames.count - 1 }
  if last < 0 { last = 0 }
  while last + 1 < frames.count && abs(time(frames[last + 1]) - t) <= abs(time(frames[last]) - t) {
    last += 1
  }
  return frames[last]
}

let asset = AVURLAsset(url: videoURL)
let loaded = DispatchSemaphore(value: 0)
var videoTrack: AVAssetTrack?
var naturalSize = CGSize.zero
var preferredTransform = CGAffineTransform.identity
var fps: Float = 30
Task {
  if let track = try? await asset.loadTracks(withMediaType: .video).first {
    videoTrack = track
    if let s = try? await track.load(.naturalSize) { naturalSize = s }
    if let t = try? await track.load(.preferredTransform) { preferredTransform = t }
    if let r = try? await track.load(.nominalFrameRate), r > 0 { fps = r }
  }
  loaded.signal()
}
loaded.wait()
guard let track = videoTrack else {
  FileHandle.standardError.write(Data("error: no video track\n".utf8))
  exit(1)
}

let width = Int(naturalSize.width)
let height = Int(naturalSize.height)
let frameOrientation = orientation(from: preferredTransform)
let swapsAxes = frameOrientation.rawValue >= 5
let outWidth = swapsAxes ? height : width
let outHeight = swapsAxes ? width : height
let ciContext = CIContext(options: [.cacheIntermediates: false])
FileHandle.standardError.write(
  Data("orientation \(frameOrientation.rawValue), rendering \(outWidth)x\(outHeight)\n".utf8))

let reader = try AVAssetReader(asset: asset)
if fromSec > 0 || toSec.isFinite {
  let start = CMTime(seconds: max(0, fromSec), preferredTimescale: 600)
  let end = toSec.isFinite ? CMTime(seconds: toSec, preferredTimescale: 600) : .positiveInfinity
  reader.timeRange = CMTimeRange(start: start, end: end)
}
let readerOutput = AVAssetReaderTrackOutput(
  track: track,
  outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
readerOutput.alwaysCopiesSampleData = false
reader.add(readerOutput)

try? FileManager.default.removeItem(at: outputURL)
let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mov)
let writerInput = AVAssetWriterInput(
  mediaType: .video,
  outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: outWidth,
    AVVideoHeightKey: outHeight,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 8_000_000],
  ])
writerInput.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: writerInput,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: outWidth,
    kCVPixelBufferHeightKey as String: outHeight,
  ])
writer.add(writerInput)
writer.startWriting()
reader.startReading()

let W = CGFloat(outWidth)
let H = CGFloat(outHeight)
let scale = H / 1920.0
let moves = ["pullup", "pushup", "squat", "row"]
let moveLabel = ["pullup": "PULL", "pushup": "PUSH", "squat": "SQUAT", "row": "ROW"]

var frameIndex = 0
var recIndex = 0
var traceIndex = 0
var firstPTS: CMTime?
var lastCountT = -10_000.0
var lastRejectT = -10_000.0
var lastRejectLabel = ""
var lastCountLabel = ""
var lastBody: [String: Joint] = [:]
var previewWritten = false

while let sample = readerOutput.copyNextSampleBuffer() {
  guard let source = CMSampleBufferGetImageBuffer(sample) else { continue }
  let pts = CMSampleBufferGetPresentationTimeStamp(sample)
  if firstPTS == nil {
    firstPTS = pts
    writer.startSession(atSourceTime: pts)
  }
  let tMs = CMTimeGetSeconds(pts) * 1000
  if tMs + 1 < fromSec * 1000 { continue }
  if tMs > toSec * 1000 { break }

  guard let pool = adaptor.pixelBufferPool else { fatalError("no pixel buffer pool") }
  var destination: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, pool, &destination)
  guard let dest = destination else { fatalError("could not create pixel buffer") }

  if frameOrientation == .up {
    CVPixelBufferLockBaseAddress(source, .readOnly)
    CVPixelBufferLockBaseAddress(dest, [])
    let srcBase = CVPixelBufferGetBaseAddress(source)!
    let copyBase = CVPixelBufferGetBaseAddress(dest)!
    let srcStride = CVPixelBufferGetBytesPerRow(source)
    let copyStride = CVPixelBufferGetBytesPerRow(dest)
    if srcStride == copyStride {
      memcpy(copyBase, srcBase, copyStride * height)
    } else {
      for row in 0..<height {
        memcpy(copyBase + row * copyStride, srcBase + row * srcStride, min(srcStride, copyStride))
      }
    }
    CVPixelBufferUnlockBaseAddress(source, .readOnly)
  } else {
    let oriented = CIImage(cvPixelBuffer: source).oriented(frameOrientation)
    let normalized = oriented.transformed(
      by: CGAffineTransform(translationX: -oriented.extent.minX, y: -oriented.extent.minY))
    ciContext.render(
      normalized, to: dest,
      bounds: CGRect(x: 0, y: 0, width: CGFloat(outWidth), height: CGFloat(outHeight)),
      colorSpace: CGColorSpaceCreateDeviceRGB())
    CVPixelBufferLockBaseAddress(dest, [])
  }

  let dstBase = CVPixelBufferGetBaseAddress(dest)!
  let dstStride = CVPixelBufferGetBytesPerRow(dest)
  let ctx = CGContext(
    data: dstBase, width: outWidth, height: outHeight, bitsPerComponent: 8, bytesPerRow: dstStride,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  ctx.translateBy(x: 0, y: H)
  ctx.scaleBy(x: 1, y: -1)
  ctx.setLineCap(.round)
  ctx.setLineJoin(.round)

  let rec = nearest(t: tMs, frames: recFrames, last: &recIndex, time: { $0.t })
  let trace = nearest(t: tMs, frames: traceFrames, last: &traceIndex, time: { $0.t })

  if let events = trace?.events {
    for event in events {
      let label = "\(moveLabel[event.move] ?? event.move.uppercased())"
      if event.kind == "count" {
        lastCountT = tMs
        lastCountLabel = label
      } else if event.kind == "reject" {
        lastRejectT = tMs
        lastRejectLabel = "\(label)  \(event.reason ?? "reject")"
      }
    }
  }

  if let body = rec?.body, !body.isEmpty { lastBody = body }
  if !lastBody.isEmpty {
    let body = lastBody
    for (a, b) in bones {
      guard let ja = body[a], let jb = body[b], ja.c >= 0.15, jb.c >= 0.15 else { continue }
      ctx.setStrokeColor(confidenceColor(min(ja.c, jb.c)))
      ctx.setLineWidth(6 * scale)
      ctx.move(to: CGPoint(x: ja.x * W, y: ja.y * H))
      ctx.addLine(to: CGPoint(x: jb.x * W, y: jb.y * H))
      ctx.strokePath()
    }
    for (name, joint) in body where joint.c >= 0.15 {
      let wrist = name == "leftWrist" || name == "rightWrist"
      let radius = (wrist ? 12.0 : 7.0) * scale
      let point = CGPoint(x: joint.x * W, y: joint.y * H)
      ctx.setFillColor(
        wrist
          ? CGColor(red: 0.2, green: 0.85, blue: 1.0, alpha: 0.95)
          : confidenceColor(joint.c))
      ctx.fillEllipse(
        in: CGRect(x: point.x - radius, y: point.y - radius, width: radius * 2, height: radius * 2))
    }
  }

  let pad = 36 * scale
  let panel = CGRect(x: pad, y: pad, width: 520 * scale, height: 520 * scale)
  ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.55))
  ctx.fill(panel)
  let justCount = tMs - lastCountT <= 280
  let justReject = tMs - lastRejectT <= 700
  if justReject {
    ctx.setStrokeColor(CGColor(red: 1.0, green: 0.25, blue: 0.2, alpha: 1))
    ctx.setLineWidth(8 * scale)
    ctx.stroke(panel)
  } else if justCount {
    ctx.setStrokeColor(CGColor(red: 0.15, green: 0.95, blue: 0.45, alpha: 1))
    ctx.setLineWidth(8 * scale)
    ctx.stroke(panel)
  }

  let posture = trace?.posture ?? "?"
  drawText(
    ctx, posture.uppercased(), x: panel.minX + 24 * scale, top: panel.minY + 16 * scale,
    size: 52 * scale, color: postureColor(posture))

  var rowY = panel.minY + 80 * scale
  for move in moves {
    let state = trace?.states[move]
    let counted = state?.count ?? 0
    let name = (moveLabel[move] ?? move).padding(toLength: 5, withPad: " ", startingAt: 0)
    let line = "\(name)  \(String(format: "%3d", counted))   \(state?.phase ?? "—")"
    drawText(
      ctx, line, x: panel.minX + 24 * scale, top: rowY, size: 36 * scale,
      color: CGColor(red: 1, green: 1, blue: 1, alpha: 0.95), bold: true)
    rowY += 48 * scale
  }

  let minutes = Int(tMs / 60_000)
  let seconds = (tMs - Double(minutes) * 60_000) / 1000
  let cover = Int(((trace?.coverage ?? 0) * 100).rounded())
  let elb = trace?.elbow.map { String(format: "%.0f°", $0) } ?? "—"
  let kne = trace?.knee.map { String(format: "%.0f°", $0) } ?? "—"
  drawText(
    ctx, String(format: "%d:%04.1f   %d%%", minutes, seconds, cover),
    x: panel.minX + 24 * scale, top: rowY + 8 * scale, size: 32 * scale,
    color: CGColor(red: 0.85, green: 0.85, blue: 0.85, alpha: 1), bold: false)
  drawText(
    ctx, "ELB \(elb)   KNE \(kne)",
    x: panel.minX + 24 * scale, top: rowY + 48 * scale, size: 32 * scale,
    color: CGColor(red: 0.85, green: 0.85, blue: 0.85, alpha: 1), bold: false)

  if justCount {
    drawText(
      ctx, lastCountLabel, x: W / 2, top: H * 0.22, size: 96 * scale,
      color: CGColor(red: 0.15, green: 0.95, blue: 0.45, alpha: 0.95), centered: true)
  } else if justReject {
    drawText(
      ctx, lastRejectLabel, x: W / 2, top: H * 0.22, size: 56 * scale,
      color: CGColor(red: 1, green: 0.35, blue: 0.3, alpha: 0.95), centered: true)
  }

  let strip = CGRect(x: pad, y: H - pad - 260 * scale, width: W - 2 * pad, height: 260 * scale)
  ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.55))
  ctx.fill(strip)
  if !traceFrames.isEmpty {
    let windowMs = 6000.0
    let lo = tMs - windowMs
    let visible = traceFrames.filter { $0.t >= lo && $0.t <= tMs }
    let mapX = { (ft: Double) -> CGFloat in
      strip.minX + CGFloat((ft - lo) / windowMs) * strip.width
    }
    let mapY = { (deg: Double) -> CGFloat in
      strip.maxY - 20 * scale - CGFloat(min(max(deg, 0), 180) / 180) * (strip.height - 50 * scale)
    }
    ctx.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.15))
    ctx.setLineWidth(1 * scale)
    for deg in [90.0, 150.0] {
      ctx.move(to: CGPoint(x: strip.minX, y: mapY(deg)))
      ctx.addLine(to: CGPoint(x: strip.maxX, y: mapY(deg)))
      ctx.strokePath()
    }
    for f in visible where !f.events.isEmpty {
      let count = f.events.contains { $0.kind == "count" }
      ctx.setStrokeColor(
        count
          ? CGColor(red: 0.15, green: 0.95, blue: 0.45, alpha: 0.7)
          : CGColor(red: 1.0, green: 0.3, blue: 0.25, alpha: 0.7))
      ctx.setLineWidth(3 * scale)
      ctx.move(to: CGPoint(x: mapX(f.t), y: strip.minY))
      ctx.addLine(to: CGPoint(x: mapX(f.t), y: strip.maxY))
      ctx.strokePath()
    }
    let elbowColor = CGColor(red: 0.35, green: 0.85, blue: 1.0, alpha: 0.95)
    let kneeColor = CGColor(red: 1.0, green: 0.55, blue: 0.2, alpha: 0.95)
    strokeSeries(
      ctx, visible, value: { $0.elbow },
      mapX: mapX, mapY: mapY, clip: strip, color: elbowColor, width: 4 * scale)
    strokeSeries(
      ctx, visible, value: { $0.knee },
      mapX: mapX, mapY: mapY, clip: strip, color: kneeColor, width: 4 * scale)
    drawText(
      ctx, "elbow", x: strip.minX + 16 * scale, top: strip.minY + 10 * scale, size: 28 * scale,
      color: elbowColor, bold: false)
    drawText(
      ctx, "knee", x: strip.minX + 140 * scale, top: strip.minY + 10 * scale, size: 28 * scale,
      color: kneeColor, bold: false)
  }

  if let previewSeconds, let previewURL, !previewWritten, tMs >= previewSeconds * 1000 {
    if let image = ctx.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
        previewURL as CFURL, UTType.png.identifier as CFString, 1, nil)
    {
      CGImageDestinationAddImage(destination, image, nil)
      CGImageDestinationFinalize(destination)
      FileHandle.standardError.write(Data("preview: \(previewURL.path) at t=\(Int(tMs))ms\n".utf8))
    }
    previewWritten = true
  }

  CVPixelBufferUnlockBaseAddress(dest, [])
  while !writerInput.isReadyForMoreMediaData { usleep(2000) }
  adaptor.append(dest, withPresentationTime: pts)
  frameIndex += 1
  if frameIndex % 300 == 0 {
    FileHandle.standardError.write(
      Data("rendered \(frameIndex) frames (\(String(format: "%.1f", tMs / 1000))s)...\n".utf8))
  }
}

writerInput.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status == .failed {
  FileHandle.standardError.write(
    Data("error: writer failed: \(writer.error?.localizedDescription ?? "unknown")\n".utf8))
  exit(1)
}
FileHandle.standardError.write(Data("done: \(frameIndex) frames -> \(outputURL.path)\n".utf8))
