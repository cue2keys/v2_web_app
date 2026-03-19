import type { LabelHTMLAttributes } from 'react';
type Props = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className: classNameProp = '', ...props }: Props) {
  const cn = typeof classNameProp === 'string' ? classNameProp : '';
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${cn}`}
      {...props}
    />
  );
}
