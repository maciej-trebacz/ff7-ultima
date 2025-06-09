import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVisibilityObserverOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

interface VisibilityState {
  [key: string]: boolean;
}

export function useVisibilityObserver(options: UseVisibilityObserverOptions = {}) {
  const [visibilityState, setVisibilityState] = useState<VisibilityState>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, Element>>(new Map());
  const pendingUpdatesRef = useRef<VisibilityState>({});
  const updateTimeoutRef = useRef<number | null>(null);

  const {
    threshold = 0,
    rootMargin = '50px',
    root = null
  } = options;

  // Initialize the observer
  useEffect(() => {
    if (!window.IntersectionObserver) {
      // Fallback for browsers without IntersectionObserver support
      // Assume all elements are visible
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Batch updates to avoid excessive re-renders
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-visibility-id');
          if (id) {
            pendingUpdatesRef.current[id] = entry.isIntersecting;
          }
        });

        // Debounce updates to improve performance
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          const updates = { ...pendingUpdatesRef.current };
          pendingUpdatesRef.current = {};

          if (Object.keys(updates).length > 0) {
            setVisibilityState(prev => ({ ...prev, ...updates }));
          }
        }, 16); // ~60fps
      },
      {
        threshold,
        rootMargin,
        root
      }
    );

    // Observe all currently tracked elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, root]);

  // Function to observe an element
  const observe = useCallback((element: Element | null, id: string) => {
    if (!element || !observerRef.current) return;

    // Set the visibility ID on the element
    element.setAttribute('data-visibility-id', id);
    
    // Store the element reference
    elementsRef.current.set(id, element);
    
    // Start observing
    observerRef.current.observe(element);
    
    // Initialize visibility state if not already set
    setVisibilityState(prev => ({
      ...prev,
      [id]: prev[id] ?? true // Default to visible until we know otherwise
    }));
  }, []);

  // Function to stop observing an element
  const unobserve = useCallback((id: string) => {
    const element = elementsRef.current.get(id);
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
      elementsRef.current.delete(id);
      setVisibilityState(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, []);

  // Function to check if an element is visible
  const isVisible = useCallback((id: string): boolean => {
    // If IntersectionObserver is not supported, assume all elements are visible
    if (!window.IntersectionObserver) {
      return true;
    }
    return visibilityState[id] ?? true; // Default to visible if not tracked yet
  }, [visibilityState]);

  return {
    observe,
    unobserve,
    isVisible,
    visibilityState
  };
}
