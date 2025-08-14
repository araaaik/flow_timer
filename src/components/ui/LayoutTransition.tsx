import React from 'react';
import { useLayoutTransition, LayoutMode, UseLayoutTransitionOptions } from '../../hooks/useLayoutTransition';

export interface LayoutTransitionProps extends UseLayoutTransitionOptions {
  mode: LayoutMode;
  children: (props: {
    currentMode: LayoutMode;
    isTransitioning: boolean;
    getTransitionStyles: (element: 'container' | 'timer' | 'tasks') => React.CSSProperties;
    getGridTransitionStyles: () => React.CSSProperties;
  }) => React.ReactNode;
  className?: string;
}

export const LayoutTransition: React.FC<LayoutTransitionProps> = ({
  mode,
  children,
  className = '',
  ...options
}) => {
  const {
    currentMode,
    isTransitioning,
    getTransitionStyles,
    getGridTransitionStyles,
  } = useLayoutTransition(mode, options);

  return (
    <div className={className} style={getTransitionStyles('container')}>
      {children({
        currentMode,
        isTransitioning,
        getTransitionStyles,
        getGridTransitionStyles,
      })}
    </div>
  );
};

export default LayoutTransition;