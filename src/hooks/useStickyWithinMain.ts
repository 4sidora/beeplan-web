import { useEffect, useRef, useState } from "react";

/** Отслеживает, ушла ли шапка за верх прокручиваемого main. */
export function useStickyWithinMain() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollRoot = sentinel?.closest("main");
    if (!sentinel || !scrollRoot) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { root: scrollRoot, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const update = () => setHeaderHeight(header.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, [title, secondaryActions.length]);

  return { sentinelRef, headerRef, stuck, headerHeight };
}
