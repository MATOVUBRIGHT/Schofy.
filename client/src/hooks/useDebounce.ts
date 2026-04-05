// client/src/hooks/useDebounce.ts
// Performance Hook: Debounce expensive operations

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce hook for search/filter operations
 * - Waits 300ms after user stops typing before executing callback
 * - Prevents excessive re-renders and DB queries
 * - Essential for search performance
 */
export function useDebounce<T>(
  value: T,
  delay: number = 300
): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return [debouncedValue, isDebouncing];
}

/**
 * Advanced debounce hook with callback and state tracking
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  dependencies: React.DependencyList = []
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isPending, setIsPending] = useState(false);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      setIsPending(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        setIsPending(false);
      }, delay);
    },
    [callback, delay, ...dependencies]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsPending(false);
    }
  }, []);

  return [debouncedCallback as T, isPending, cancel] as const;
}

/**
 * Throttle hook for high-frequency events
 * - Limits function calls to once per interval
 * - Better for scroll/resize events
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  interval: number = 100,
  dependencies: React.DependencyList = []
) {
  const lastExecutedRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutedRef.current;

      if (timeSinceLastExecution >= interval) {
        callback(...args);
        lastExecutedRef.current = now;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
          () => {
            callback(...args);
            lastExecutedRef.current = Date.now();
          },
          interval - timeSinceLastExecution
        );
      }
    },
    [callback, interval, ...dependencies]
  );

  return throttledCallback as T;
}
