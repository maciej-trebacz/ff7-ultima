import { forwardRef } from 'react';
import { LucideProps } from 'lucide-react';

export const ChocoboHead = forwardRef<SVGSVGElement, LucideProps>(({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 8L17 12C17 16 15 22 15 22H10C10 18 10 16 9 15C6 16 3 14 2 13C4 10 8 8 10 8L11 5L10 2L12 4L15 2L15 6L19 4L17 8L21 8Z" />
      <path d="M2 13C6 13 9 15 9 15" />
      <circle cx="13" cy="10" r="1.5" />
    </svg>
  );
});

ChocoboHead.displayName = "ChocoboHead";
