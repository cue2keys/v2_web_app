import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className: classNameProp = '', ...props }, ref) => {
    const cn = typeof classNameProp === 'string' ? classNameProp : '';
    return <input ref={ref} className={`kbd-input ${cn}`} {...props} />;
  },
);

Input.displayName = 'Input';
