Pod::Spec.new do |s|
  s.name           = 'AppleVisionPose'
  s.version        = '1.0.0'
  s.summary        = 'On-device body pose from the camera via Apple Vision, for Suit Up.'
  s.description    = 'Owns an AVCaptureSession, runs VNDetectHumanBodyPoseRequest per frame and emits vendor-free keypoints to JS. Pixels never leave the device.'
  s.author         = 'App Factory'
  s.homepage       = 'https://github.com/salaseviciusm/app-factory'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '17.0' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.frameworks = 'AVFoundation', 'Vision', 'CoreMedia', 'CoreVideo'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
