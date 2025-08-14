/**
 * Animation configuration for consistent timing and easing across the application
 */

export interface AnimationConfig {
  duration: {
    fast: number;      // 150ms - быстрые hover эффекты
    normal: number;    // 240ms - стандартные переходы
    slow: number;      // 400ms - сложные анимации
    layout: number;    // 500ms - изменения layout
  };
  easing: {
    standard: string;  // cubic-bezier(0.22, 1, 0.36, 1)
    decelerate: string; // cubic-bezier(0.0, 0.0, 0.2, 1)
    accelerate: string; // cubic-bezier(0.4, 0.0, 1, 1)
    sharp: string;     // cubic-bezier(0.4, 0.0, 0.6, 1)
  };
  stagger: {
    base: number;      // 50ms - базовая задержка между элементами
    increment: number; // 25ms - увеличение задержки
  };
}

export const ANIMATION_CONFIG: AnimationConfig = {
  duration: {
    fast: 150,
    normal: 240,
    slow: 400,
    layout: 500,
  },
  easing: {
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },
  stagger: {
    base: 50,
    increment: 25,
  },
};

/**
 * Get staggered delay for multiple elements
 */
export const getStaggerDelay = (index: number): number => {
  return ANIMATION_CONFIG.stagger.base + (index * ANIMATION_CONFIG.stagger.increment);
};

/**
 * CSS custom properties for animations
 */
export const getCSSAnimationVars = () => ({
  '--animation-duration-fast': `${ANIMATION_CONFIG.duration.fast}ms`,
  '--animation-duration-normal': `${ANIMATION_CONFIG.duration.normal}ms`,
  '--animation-duration-slow': `${ANIMATION_CONFIG.duration.slow}ms`,
  '--animation-duration-layout': `${ANIMATION_CONFIG.duration.layout}ms`,
  '--animation-easing-standard': ANIMATION_CONFIG.easing.standard,
  '--animation-easing-decelerate': ANIMATION_CONFIG.easing.decelerate,
  '--animation-easing-accelerate': ANIMATION_CONFIG.easing.accelerate,
  '--animation-easing-sharp': ANIMATION_CONFIG.easing.sharp,
});