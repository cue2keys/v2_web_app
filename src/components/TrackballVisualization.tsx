import type { FC, PointerEvent } from 'react';
import { toPoint } from '@/lib/angleUtils';

interface Props {
  contactAngle: number;
  onPointerDown: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: PointerEvent<SVGSVGElement>) => void;
}

const renderDot = (angle: number, color: string, r: number, cx: number, cy: number, size = 7) => {
  const pt = toPoint(angle, r, cx, cy);
  return (
    <g>
      <line
        x1={cx}
        y1={cy}
        x2={pt.x}
        y2={pt.y}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <circle cx={pt.x} cy={pt.y} r={size} fill={color} stroke="white" strokeWidth={2} />
    </g>
  );
};

export const TrackballVisualization: FC<Props> = ({
  contactAngle,
  onPointerDown,
  onPointerMove,
}) => {
  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 280 280"
      role="presentation"
      className="cursor-pointer select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <defs>
        <linearGradient id="tb-grid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fdf4f3" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="280" height="280" rx="12" fill="url(#tb-grid)" />
      <g transform="translate(140 140)">
        <circle cx="0" cy="0" r="100" fill="white" stroke="#d9d0cb" strokeWidth="2" />
        {[0, 90, 180, 270].map((deg) => {
          const pt = toPoint(deg, 100, 0, 0);
          return (
            <line key={deg} x1="0" y1="0" x2={pt.x} y2={pt.y} stroke="#e8dfda" strokeWidth="2" />
          );
        })}
        <text x="0" y="-110" textAnchor="middle" fontSize="12" fill="#737373">
          0°
        </text>
        <circle cx="0" cy="0" r="4" fill="#737373" />
        {renderDot(contactAngle, '#e09a70', 96, 0, 0)}
      </g>
    </svg>
  );
};
