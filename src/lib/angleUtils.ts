export const normalizeAngle = (n: number) => ((Math.round(n) % 360) + 360) % 360;

export const toPoint = (angle: number, r: number, cx: number, cy: number) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

export const pointToAngle = (x: number, y: number) =>
  normalizeAngle((Math.atan2(y, x) * 180) / Math.PI + 90);
