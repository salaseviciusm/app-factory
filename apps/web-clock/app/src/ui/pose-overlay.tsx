import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { color } from '../design';
import { BONES, joint, type PoseFrame } from '../domain/pose/pose-frame';

/**
 * Draws the live skeleton over the camera preview. The preview is aspect-fill, so a
 * normalized keypoint maps through the same scale-and-centre the layer applies.
 */
export function PoseOverlay({
  frame,
  tone = 'neutral',
}: {
  frame: PoseFrame | undefined;
  tone?: 'neutral' | 'ok' | 'reject';
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const stroke =
    tone === 'ok' ? color.accent : tone === 'reject' ? color.danger : color.textPrimary;
  const map = mapper(frame, size.width, size.height);

  return (
    <View style={styles.fill} onLayout={onLayout} pointerEvents="none">
      {frame && size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          {BONES.map(([a, b]) => {
            const pa = joint(frame, a);
            const pb = joint(frame, b);
            if (!pa || !pb) {
              return null;
            }
            const A = map(pa.x, pa.y);
            const B = map(pb.x, pb.y);
            return (
              <Line
                key={`${a}-${b}`}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={stroke}
                strokeWidth={3}
                strokeOpacity={0.85}
                strokeLinecap="round"
              />
            );
          })}
          {Object.entries(frame.joints).map(([name, p]) => {
            if (!p || p.c < 0.3) {
              return null;
            }
            const P = map(p.x, p.y);
            return <Circle key={name} cx={P.x} cy={P.y} r={4} fill={stroke} fillOpacity={0.9} />;
          })}
        </Svg>
      ) : null}
    </View>
  );
}

function mapper(frame: PoseFrame | undefined, viewW: number, viewH: number) {
  if (!frame || viewW === 0 || viewH === 0) {
    return (x: number, y: number) => ({ x, y });
  }
  const scale = Math.max(viewW / frame.width, viewH / frame.height);
  const drawnW = frame.width * scale;
  const drawnH = frame.height * scale;
  const offsetX = (viewW - drawnW) / 2;
  const offsetY = (viewH - drawnH) / 2;
  return (x: number, y: number) => ({ x: offsetX + x * drawnW, y: offsetY + y * drawnH });
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
