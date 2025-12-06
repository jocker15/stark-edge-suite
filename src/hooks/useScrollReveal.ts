import { useEffect, useRef, useState } from 'react';

export function useScrollReveal<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isRevealed };
}

export function useMultiScrollReveal(count: number, threshold = 0.1) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(new Array(count).fill(false));

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    refs.current.forEach((element, index) => {
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealed(prev => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
            observer.unobserve(element);
          }
        },
        { threshold, rootMargin: '0px 0px -50px 0px' }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [count, threshold]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { setRef, revealed };
}
