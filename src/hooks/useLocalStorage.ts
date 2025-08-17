import { useState, useCallback, useRef } from 'react';

// Cache for parsed values to avoid repeated JSON.parse
const parseCache = new Map<string, any>();

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check cache first
      if (parseCache.has(key)) {
        return parseCache.get(key);
      }
      
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      
      // Cache the parsed value
      parseCache.set(key, parsed);
      return parsed;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Use ref to avoid stale closure issues
  const storedValueRef = useRef(storedValue);
  storedValueRef.current = storedValue;

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
      setStoredValue(valueToStore);
      
      // Update cache
      parseCache.set(key, valueToStore);
      
      // Batch localStorage writes to avoid blocking
      requestIdleCallback(() => {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }, { timeout: 100 });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue] as const;
}