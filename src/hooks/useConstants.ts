/**
 * Optimized constants hook
 * Provides memoized constants to avoid recreating objects on every render
 */

import { useMemo } from 'react';
import { STORAGE_KEYS, TIME_CONSTANTS, DEFAULTS, FILE_TYPES } from '../utils/constants';

export const useConstants = () => {
  return useMemo(() => ({
    STORAGE_KEYS,
    TIME_CONSTANTS,
    DEFAULTS,
    FILE_TYPES,
  }), []);
};

// Individual constant hooks for specific use cases
export const useStorageKeys = () => useMemo(() => STORAGE_KEYS, []);
export const useTimeConstants = () => useMemo(() => TIME_CONSTANTS, []);
export const useDefaults = () => useMemo(() => DEFAULTS, []);
export const useFileTypes = () => useMemo(() => FILE_TYPES, []);