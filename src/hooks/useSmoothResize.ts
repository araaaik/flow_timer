import { useEffect, useRef, useState } from 'react';
import { ANIMATION_CONFIG, AnimationConfig } from '../utils/animationConfig';

export interface UseSmoothResizeOptions {
  duration?: keyof AnimationConfig['duration'];
  minHeight?: number;
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  animateHeight?: boolean;
  animateWidth?: boolean;
}

export interface SmoothResizeState {
  height: number | 'auto';
  width: number | 'auto';
  isAnimating: boolean;
}

export const useSmoothResize = (
  content: React.ReactNode | any,
  options: UseSmoothResizeOptions = {}
) => {
  const {
    duration = 'normal',
    minHeight = 0,
    maxHeight = Infinity,
    minWidth = 0,
    maxWidth = Infinity,
    animateHeight = true,
    animateWidth = false,
  } = options;

  const [state, setState] = useState<SmoothResizeState>({
    height: 'auto',
    width: 'auto',
    isAnimating: false,
  });

  const measureRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);
  const durationMs = ANIMATION_CONFIG.duration[duration];

  useEffect(() => {
    if (contentRef.current === content) return;
    contentRef.current = content;

    if (!measureRef.current) return;

    setState(prev => ({ ...prev, isAnimating: true }));

    // Measure the new content size
    const measureElement = () => {
      if (!measureRef.current) return;

      const rect = measureRef.current.getBoundingClientRect();
      let newHeight: number | 'auto' = 'auto';
      let newWidth: number | 'auto' = 'auto';

      if (animateHeight) {
        newHeight = Math.min(Math.max(rect.height, minHeight), maxHeight);
      }

      if (animateWidth) {
        newWidth = Math.min(Math.max(rect.width, minWidth), maxWidth);
      }

      setState(prev => ({
        ...prev,
        height: newHeight,
        width: newWidth,
      }));

      // Reset animation state after transition
      setTimeout(() => {
        setState(prev => ({ ...prev, isAnimating: false }));
      }, durationMs);
    };

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(measureElement);
  }, [content, animateHeight, animateWidth, minHeight, maxHeight, minWidth, maxWidth, durationMs]);

  const containerStyle: React.CSSProperties = {
    transition: `${animateHeight ? 'height' : ''} ${animateWidth ? 'width' : ''} ${durationMs}ms ${ANIMATION_CONFIG.easing.standard}`.trim(),
    overflow: 'hidden',
    ...(state.height !== 'auto' && { height: state.height }),
    ...(state.width !== 'auto' && { width: state.width }),
    ...(minHeight > 0 && { minHeight }),
    ...(maxHeight < Infinity && { maxHeight }),
    ...(minWidth > 0 && { minWidth }),
    ...(maxWidth < Infinity && { maxWidth }),
  };

  return {
    containerStyle,
    measureRef,
    isAnimating: state.isAnimating,
  };
};