import Svg, { Circle, Line } from 'react-native-svg';
import { color } from '../design';
import { BONES } from '../domain/pose/pose-frame';

type CompactJoints = ReadonlyArray<readonly [string, number, number]>;

/**
 * The share-card figure: keypoints from one frame of the session, no pixels. Fitted
 * into the box with a margin so any framing reads as a person.
 */
export function SkeletonFigure({
  joints,
  size = 120,
  stroke = color.accent,
}: {
  joints: CompactJoints;
  size?: number;
  stroke?: string;
}) {
  const points = new Map(joints.map(([name, x, y]) => [name, { x, y }]));
  if (points.size === 0) {
    return <Svg width={size} height={size} />;
  }
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of points.values()) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const span = Math.max(maxX - minX, maxY - minY, 0.05);
  const margin = size * 0.12;
  const scale = (size - margin * 2) / span;
  const offsetX = margin + (size - margin * 2 - (maxX - minX) * scale) / 2;
  const offsetY = margin + (size - margin * 2 - (maxY - minY) * scale) / 2;
  const map = (x: number, y: number) => ({
    x: offsetX + (x - minX) * scale,
    y: offsetY + (y - minY) * scale,
  });

  return (
    <Svg width={size} height={size}>
      {BONES.map(([a, b]) => {
        const pa = points.get(a);
        const pb = points.get(b);
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
            strokeWidth={size / 40}
            strokeLinecap="round"
          />
        );
      })}
      {[...points.entries()].map(([name, p]) => {
        const P = map(p.x, p.y);
        return <Circle key={name} cx={P.x} cy={P.y} r={size / 30} fill={stroke} />;
      })}
    </Svg>
  );
}
