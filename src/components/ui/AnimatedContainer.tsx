import React from 'react';
import { useSmoothResize, UseSmoothResizeOptions } from '../../hooks/useSmoothResize';

export interface AnimatedContainerProps extends UseSmoothResizeOptions {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className = '',
  style = {},
  onAnimationStart,
  onAnimationEnd,
  ...resizeOptions
}) => {
  const { containerStyle, measureRef, isAnimating } = useSmoothResize(children, resizeOptions);

  React.useEffect(() => {
    if (isAnimating) {
      onAnimationStart?.();
    } else {
      onAnimationEnd?.();
    }
  }, [isAnimating, onAnimationStart, onAnimationEnd]);

  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        ...style,
      }}
    >
      <div ref={measureRef}>
        {children}
      </div>
    </div>
  );
};

export default AnimatedContainer;