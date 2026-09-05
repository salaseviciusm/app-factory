import AVFoundation
import ExpoModulesCore

/// Camera preview bound to the shared capture session. Aspect-fill, so the JS overlay
/// maps normalized keypoints with the same rule (see src/ui/pose-overlay.tsx).
final class PosePreviewView: ExpoView {
  private let previewLayer = AVCaptureVideoPreviewLayer()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    previewLayer.videoGravity = .resizeAspectFill
    previewLayer.session = PoseCaptureSession.shared.captureSession
    layer.addSublayer(previewLayer)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    previewLayer.frame = bounds
    if let connection = previewLayer.connection, connection.isVideoRotationAngleSupported(90) {
      connection.videoRotationAngle = 90
    }
  }
}
