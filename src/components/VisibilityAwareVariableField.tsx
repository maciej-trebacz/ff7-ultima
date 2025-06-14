import React, { useRef, useEffect, memo } from 'react';
import { SimpleVariableField } from '@/components/modals/VariableFields/SimpleVariableField';
import { BitmaskVariableField } from '@/components/modals/VariableFields/BitmaskVariableField';
import { TimerVariableField } from '@/components/modals/VariableFields/TimerVariableField';
import { TextVariableField } from '@/components/modals/VariableFields/TextVariableField';
import { VariableFieldDefinition } from '@/components/modals/VariableFields/types';
import { useVisibilityObserver } from '@/hooks/useVisibilityObserver';

interface VisibilityAwareVariableFieldProps {
  variable: VariableFieldDefinition & { bankNumber?: number; bankTitle?: string };
  value: number | Uint8Array;
  onChange: (value: number | Uint8Array) => void;
  isChanged: boolean;
  searchQuery?: string;
  uniqueId: string; // Unique identifier for this field instance
}

interface FieldState {
  value: number | Uint8Array;
  isChanged: boolean;
}

const VisibilityAwareVariableFieldComponent: React.FC<VisibilityAwareVariableFieldProps> = ({
  variable,
  value,
  onChange,
  isChanged,
  searchQuery,
  uniqueId
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { observe, unobserve, isVisible } = useVisibilityObserver({
    threshold: 0,
    rootMargin: '100px' // Start loading content 100px before it comes into view
  });
  
  // Store the last known state when the component was visible
  const lastVisibleStateRef = useRef<FieldState>({ value, isChanged });
  
  // Track if this is the first render
  const isFirstRenderRef = useRef(true);

  // Set up intersection observer
  useEffect(() => {
    if (elementRef.current) {
      observe(elementRef.current, uniqueId);
    }

    return () => {
      unobserve(uniqueId);
    };
  }, [observe, unobserve, uniqueId]);

  // Determine what values to use
  const visible = isVisible(uniqueId);
  const shouldUpdate = visible || isFirstRenderRef.current;

  // Update last visible state when component is visible and should update
  useEffect(() => {
    if (shouldUpdate) {
      lastVisibleStateRef.current = { value, isChanged };
      isFirstRenderRef.current = false;
    }
  }, [value, isChanged, shouldUpdate]);

  // Use current values if visible or first render, otherwise use last known values
  const displayValue = shouldUpdate ? value : lastVisibleStateRef.current.value;
  const displayIsChanged = shouldUpdate ? isChanged : lastVisibleStateRef.current.isChanged;

  // Render the appropriate field component based on variable type
  const renderField = () => {
    switch (variable.type) {
      case 'text':
        return (
          <TextVariableField
            variable={variable}
            value={displayValue as Uint8Array}
            onChange={onChange as (value: Uint8Array) => void}
            isChanged={displayIsChanged}
            searchQuery={searchQuery}
          />
        );
      case 'simple':
        return (
          <SimpleVariableField
            variable={variable}
            value={displayValue as number}
            onChange={onChange as (value: number) => void}
            isChanged={displayIsChanged}
            searchQuery={searchQuery}
          />
        );
      case 'bitmask':
        return (
          <BitmaskVariableField
            variable={variable}
            value={displayValue as number}
            onChange={onChange as (value: number) => void}
            isChanged={displayIsChanged}
            searchQuery={searchQuery}
          />
        );
      case 'timer':
        return (
          <TimerVariableField
            variable={variable}
            value={displayValue as number}
            onChange={onChange as (value: number) => void}
            isChanged={displayIsChanged}
            searchQuery={searchQuery}
          />
        );
      default:
        // Fallback to simple field for unknown types
        return (
          <SimpleVariableField
            variable={variable}
            value={displayValue as number}
            onChange={onChange as (value: number) => void}
            isChanged={displayIsChanged}
            searchQuery={searchQuery}
          />
        );
    }
  };

  return (
    <div ref={elementRef} data-visibility-id={uniqueId}>
      {renderField()}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const VisibilityAwareVariableField = memo(VisibilityAwareVariableFieldComponent, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Re-render if any key props have changed
  return (
    prevProps.uniqueId === nextProps.uniqueId &&
    prevProps.value === nextProps.value &&
    prevProps.isChanged === nextProps.isChanged &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.variable.offset === nextProps.variable.offset &&
    prevProps.variable.name === nextProps.variable.name &&
    prevProps.variable.type === nextProps.variable.type
  );
});

VisibilityAwareVariableField.displayName = 'VisibilityAwareVariableField';
