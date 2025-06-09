import React, { useRef, useEffect, useState } from 'react';
import { useVisibilityObserver } from '@/hooks/useVisibilityObserver';

interface VisibilityTestComponentProps {
  id: string;
  children: React.ReactNode;
}

export const VisibilityTestComponent: React.FC<VisibilityTestComponentProps> = ({ id, children }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { observe, unobserve, isVisible } = useVisibilityObserver();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  useEffect(() => {
    if (elementRef.current) {
      observe(elementRef.current, id);
    }

    return () => {
      unobserve(id);
    };
  }, [observe, unobserve, id]);

  const visible = isVisible(id);

  return (
    <div 
      ref={elementRef}
      className={`p-4 border-2 ${visible ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
      style={{ minHeight: '100px' }}
    >
      <div className="text-sm font-mono">
        ID: {id} | Visible: {visible ? 'YES' : 'NO'} | Renders: {renderCount}
      </div>
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
};
