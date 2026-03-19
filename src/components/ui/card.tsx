import type { ReactNode } from 'react';

export function Card({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <div className={`kbd-card ${className}`}>{children}</div>;
}

export function CardTitle({
  className = '',
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={`kbd-title ${className}`}>{children}</div>;
}

export function CardContent({
  className = '',
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={`pt-2 ${className}`}>{children}</div>;
}
