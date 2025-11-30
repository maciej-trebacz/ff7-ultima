import { forwardRef } from 'react';
import { LucideProps } from 'lucide-react';

export const CloudParty = forwardRef<SVGSVGElement, LucideProps>(({ color = "currentColor", size = 24, strokeWidth = 2, className, ...props }, ref) => {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M5 7a4 4 0 0 0 8 0l2-3l-3 2l-1-4l-2 3l-3-2Z" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
});

CloudParty.displayName = "CloudParty";

