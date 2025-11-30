import { forwardRef } from 'react';
import { LucideProps } from 'lucide-react';

export const BinaryGrid = forwardRef<SVGSVGElement, LucideProps>(({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
        <path d="M10 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
        <path d="M16 4L16 8" />
        <path d="M8 12L8 16" />
        <path d="M18 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
    </svg>
  );
});

BinaryGrid.displayName = "BinaryGrid";
