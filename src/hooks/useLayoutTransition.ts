import { useEffect, useState } from 'react';
import { ANIMATION_CONFIG, AnimationConfig } from '../utils/animationConfig';

export type LayoutMode = 'widget' | 'compact' | 'full';

export interface LayoutTransitionState {
  currentMode: LayoutMode;
  previousMode: LayoutMode | null;
  isTransitioning: boolean;
  transitionProgress: number; // 0 to 1
}

export interface UseLayoutTransitionOptions {
  duration?: keyof AnimationConfig['duration'];
  onTransitionStart?: (from: LayoutMode, to: LayoutMode) => void;
  onTransitionEnd?: (from: LayoutMode, to: LayoutMode) => void;
}

export const useLayoutTransition = (
  mode: LayoutMode,
  options: UseLayoutTransitionOptions = {}
) => {
  const {
    duration = 'layout',
    onTransitionStart,
    onTransitionEnd,
  } = options;

  const [state, setState] = useState<LayoutTransitionState>({
    currentMode: mode,
    previousMode: null,
    isTransitioning: false,
    transitionProgress: 1,
  });

  const durationMs = ANIMATION_CONFIG.duration[duration];

  useEffect(() => {
    if (state.currentMode === mode) return;

    const previousMode = state.currentMode;
    
    // Start transition
    setState(prev => ({
      ...prev,
      previousMode: prev.currentMode,
      currentMode: mode,
      isTransitioning: true,
      transitionProgress: 0,
    }));

    onTransitionStart?.(previousMode, mode);

    // Animate progress
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      setState(prev => ({
        ...prev,
        transitionProgress: progress,
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Transition complete
        setState(prev => ({
          ...prev,
          isTransitioning: false,
          previousMode: null,
          transitionProgress: 1,
        }));

        onTransitionEnd?.(previousMode, mode);
      }
    };

    requestAnimationFrame(animate);
  }, [mode, durationMs, onTransitionStart, onTransitionEnd, state.currentMode]);

  const getTransitionStyles = (element: 'container' | 'timer' | 'tasks'): React.CSSProperties => {
    const easing = ANIMATION_CONFIG.easing.standard;
    
    const baseStyles: React.CSSProperties = {
      transition: `all ${durationMs}ms ${easing}`,
    };

    if (!state.isTransitioning) {
      return baseStyles;
    }

    const progress = state.transitionProgress;
    const { previousMode, currentMode } = state;

    // Define transition behaviors for different elements
    switch (element) {
      case 'container':
        return {
          ...baseStyles,
          opacity: 0.8 + (0.2 * progress), // Slight fade during transition
        };

      case 'timer':
        // Timer scaling and positioning transitions
        if (previousMode === 'widget' && currentMode === 'compact') {
          return {
            ...baseStyles,
            transform: `scale(${0.9 + (0.1 * progress)})`,
          };
        }
        if (previousMode === 'compact' && currentMode === 'widget') {
          return {
            ...baseStyles,
            transform: `scale(${1 - (0.1 * progress)})`,
          };
        }
        return baseStyles;

      case 'tasks':
        // Tasks panel slide and fade transitions
        if (currentMode === 'widget') {
          return {
            ...baseStyles,
            opacity: 1 - progress,
            transform: `translateY(${progress * 20}px)`,
          };
        }
        if (previousMode === 'widget') {
          return {
            ...baseStyles,
            opacity: progress,
            transform: `translateY(${(1 - progress) * 20}px)`,
          };
        }
        return baseStyles;

      default:
        return baseStyles;
    }
  };

  const getGridTransitionStyles = (): React.CSSProperties => {
    const easing = ANIMATION_CONFIG.easing.standard;
    
    return {
      transition: `grid-template-columns ${durationMs}ms ${easing}, grid-template-rows ${durationMs}ms ${easing}, gap ${durationMs}ms ${easing}`,
    };
  };

  return {
    ...state,
    getTransitionStyles,
    getGridTransitionStyles,
    durationMs,
  };
};