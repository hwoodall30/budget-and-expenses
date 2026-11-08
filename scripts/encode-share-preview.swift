import AVFoundation
import AppKit

let directory = CommandLine.arguments[1]
let output = URL(fileURLWithPath: CommandLine.arguments[2])
try? FileManager.default.removeItem(at: output)
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: 1200,
    AVVideoHeightKey: 630,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1_500_000]
])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: 1200,
    kCVPixelBufferHeightKey as String: 630,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
])
writer.add(input)
writer.shouldOptimizeForNetworkUse = true
writer.startWriting()
writer.startSession(atSourceTime: .zero)
for frame in 0..<120 {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
    let url = URL(fileURLWithPath: directory).appendingPathComponent(String(format: "%03d.png", frame))
    let image = NSImage(contentsOf: url)!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
    var buffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
    let pixel = buffer!
    CVPixelBufferLockBaseAddress(pixel, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: 1200, height: 630, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    context.draw(image, in: CGRect(x: 0, y: 0, width: 1200, height: 630))
    CVPixelBufferUnlockBaseAddress(pixel, [])
    guard adaptor.append(pixel, withPresentationTime: CMTime(value: Int64(frame), timescale: 24)) else { fatalError("Could not append frame: \(String(describing: writer.error))") }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { fatalError("Encoding failed: \(String(describing: writer.error))") }
