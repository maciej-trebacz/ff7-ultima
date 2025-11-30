import { forwardRef } from 'react';
import { LucideProps } from 'lucide-react';

export const BusterSword = forwardRef<SVGSVGElement, LucideProps>(({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <g transform="rotate(45 12 12)">
        <path d="M12 21L12 17" />
        <path d="M7 17H17" />
        <path d="M9 17V2L15 6V17" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="8" r="1.5" />
      </g>
    </svg>
  );
});

BusterSword.displayName = "BusterSword";

