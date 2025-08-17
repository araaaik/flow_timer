/**
 * Lazy loading utilities
 * Optimized component and resource loading
 */

import { lazy, ComponentType } from 'react';

/**
 * Enhanced lazy loading with retry mechanism
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): ComponentType<any> {
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        
        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  });
}

/**
 * Preload a component for better UX
 */
export function preloadComponent(componentImport: () => Promise<any>): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentImport().catch(() => {
        // Silently fail preloading
      });
    });
  } else {
    setTimeout(() => {
      componentImport().catch(() => {
        // Silently fail preloading
      });
    }, 100);
  }
}

/**
 * Intersection Observer based lazy loading for images
 */
export class LazyImageLoader {
  private static observer: IntersectionObserver | null = null;
  private static images = new WeakMap<HTMLImageElement, string>();

  static observe(img: HTMLImageElement, src: string): void {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = this.images.get(img);
              
              if (src) {
                img.src = src;
                img.classList.remove('lazy');
                this.observer?.unobserve(img);
                this.images.delete(img);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
        }
      );
    }

    this.images.set(img, src);
    this.observer.observe(img);
  }

  static unobserve(img: HTMLImageElement): void {
    this.observer?.unobserve(img);
    this.images.delete(img);
  }

  static disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}