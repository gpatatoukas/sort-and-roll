export type Point = { x: number; y: number };
export function pourGeometry(
  source: Point,
  target: Point,
  width: number,
  height: number,
  boardWidth: number,
) {
  const direction =
    Math.abs(target.x - source.x) > 1
      ? target.x > source.x
        ? 1
        : -1
      : target.x + width / 2 < boardWidth / 2
        ? -1
        : 1;
  const angle = direction * 65;
  const half = (height + 13) / 2;
  const mouthX = target.x + width / 2;
  const mouthY = target.y + 22;
  const gap = 24;
  const centreX = mouthX - Math.sin((angle * Math.PI) / 180) * half;
  const centreY = mouthY - gap + Math.cos((angle * Math.PI) / 180) * half;
  const start = { x: source.x + width * 0.07, y: source.y + 22 - 14 };
  const end = { x: centreX - (width * 0.86) / 2, y: centreY - half };
  return {
    direction,
    angle,
    start,
    end,
    liftY: Math.min(start.y, end.y) - height * 0.55,
    mouthX,
    mouthY,
    gap,
  };
}
