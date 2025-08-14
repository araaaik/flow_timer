import React, { useEffect, useState } from 'react';
import { ANIMATION_CONFIG, AnimationConfig } from '../../utils/animationConfig';

export interface SmoothTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  type: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  duration?: keyof AnimationConfig['duration'];
  delay?: number;
  className?: string;
  onTransitionEnd?: () => void;
}

export const SmoothTransition: React.FC<SmoothTransitionProps> = ({
  children,
  isVisible,
  type,
  duration = 'normal',
  delay = 0,
  className = '',
  onTransitionEnd,
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  const durationMs = ANIMATION_CONFIG.duration[duration];
  const easing = ANIMATION_CONFIG.easing.standard;

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Trigger animation after render
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        onTransitionEnd?.();
      }, durationMs + delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, durationMs, delay, onTransitionEnd]);

  if (!shouldRender) {
    return null;
  }

  const getTransitionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transition: `all ${durationMs}ms ${easing}`,
      transitionDelay: `${delay}ms`,
    };

    if (!isAnimating) {
      // Initial state (hidden)
      switch (type) {
        case 'fade':
          return {
            ...baseStyles,
            opacity: 0,
          };
        case 'slide-up':
          return {
            ...baseStyles,
            opacity: 0,
            transform: 'translateY(16px)',
          };
        case 'slide-down':
          return {
            ...baseStyles,
            opacity: 0,
            transform: 'translateY(-16px)',
          };
        case 'scale':
          return {
            ...baseStyles,
            opacity: 0,
            transform: 'scale(0.95)',
          };
        default:
          return baseStyles;
      }
    } else {
      // Final state (visible)
      return {
        ...baseStyles,
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      };
    }
  };

  return (
    <div
      className={className}
      style={getTransitionStyles()}
      onTransitionEnd={onTransitionEnd}
    >
      {children}
    </div>
  );
};

export default SmoothTransition;