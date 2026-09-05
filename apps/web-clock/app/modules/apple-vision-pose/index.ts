import {
  NativeModule,
  requireNativeViewManager,
  requireOptionalNativeModule,
} from 'expo-modules-core';
import type { ComponentType } from 'react';
import type { ViewProps } from 'react-native';

/** Wire payload from the Swift side; converted to PoseFrame by the live adapter. */
export interface NativePosePayload {
  readonly tMs: number;
  readonly width: number;
  readonly height: number;
  readonly joints: Readonly<Record<string, readonly [number, number, number]>>;
}

export type CameraFacing = 'front' | 'back';
export type CameraPermission = 'granted' | 'denied' | 'undetermined';

type Events = {
  onPose: (payload: NativePosePayload) => void;
  onError: (payload: { message: string }) => void;
};

declare class AppleVisionPoseNativeModule extends NativeModule<Events> {
  isAvailable(): boolean;
  getPermission(): CameraPermission;
  requestPermission(): Promise<CameraPermission>;
  start(options: { facing: CameraFacing; fps: number }): Promise<void>;
  stop(): Promise<void>;
}

/** Null in Expo Go and on platforms without the module; the app then runs on sim. */
export const AppleVisionPose: AppleVisionPoseNativeModule | null =
  requireOptionalNativeModule<AppleVisionPoseNativeModule>('AppleVisionPose');

export const PosePreview: ComponentType<ViewProps> | null = AppleVisionPose
  ? requireNativeViewManager<ViewProps>('AppleVisionPose')
  : null;
