/**
 * Performance utilities for czToDo extension
 * Includes caching, debouncing, throttling, and memoization
 */

/**
 * Simple LRU cache for storing and retrieving values
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

/**
 * Debounce function calls - useful for search, resize, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle function calls - useful for scroll events, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Memoize a function result based on arguments
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize: number = 10
) {
  const cache = new LRUCache<string, ReturnType<T>>(maxCacheSize);

  return function (...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * RequestAnimationFrame wrapper for smooth animations
 */
export function scheduleAnimationFrame(callback: () => void): () => void {
  let frameId: number | null = null;

  const scheduleFrame = () => {
    frameId = requestAnimationFrame(callback);
  };

  scheduleFrame();

  return () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Batch multiple updates into a single animation frame
 */
export class AnimationFrameBatcher {
  private callbacks: Set<() => void> = new Set();
  private frameScheduled = false;

  add(callback: () => void): void {
    this.callbacks.add(callback);

    if (!this.frameScheduled) {
      this.frameScheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  private flush(): void {
    const callbacks = Array.from(this.callbacks);
    this.callbacks.clear();
    this.frameScheduled = false;

    callbacks.forEach(callback => callback());
  }
}

/**
 * Simple performance timer
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private marks: Map<string, number> = new Map();

  start(): void {
    this.startTime = performance.now();
  }

  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  measure(label: string, fromMark?: string): number {
    const endTime = performance.now();
    const startTime = fromMark
      ? this.marks.get(fromMark) || this.startTime
      : this.startTime;

    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  clear(): void {
    this.marks.clear();
    this.startTime = 0;
  }
}

/**
 * Lazy load resources
 */
export async function lazyLoadResource(
  resourceId: string,
  loader: () => Promise<any>
): Promise<any> {
  const cachedResource = sessionStorage.getItem(`lazy_${resourceId}`);

  if (cachedResource) {
    try {
      return JSON.parse(cachedResource);
    } catch (err) {
      console.error('Failed to parse cached resource:', err);
    }
  }

  const resource = await loader();
  sessionStorage.setItem(`lazy_${resourceId}`, JSON.stringify(resource));

  return resource;
}

/**
 * Request idle callback polyfill
 */
export function scheduleIdleCallback(
  callback: () => void,
  timeoutMs: number = 5000
): number {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(() => callback(), { timeout: timeoutMs });
  }

  // Fallback: schedule on next microtask
  return setTimeout(callback, 0) as unknown as number;
}

/**
 * Intersection Observer helper for lazy loading
 */
export function observeElement(
  element: Element,
  callback: (isVisible: boolean) => void,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        callback(entry.isIntersecting);
      });
    },
    options
  );

  observer.observe(element);

  return () => observer.disconnect();
}
