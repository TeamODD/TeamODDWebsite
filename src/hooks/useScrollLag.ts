import { useEffect, useRef } from "react";

export function useScrollLag<T extends HTMLElement>(stickyTop?: number, active = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!active || !element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let previousY = window.scrollY;
    let lag = 0;
    let frame = 0;
    const animate = () => {
      lag *= 0.82;
      if (Math.abs(lag) < 0.4) lag = 0;
      element.style.transform = lag ? `translate3d(0, ${lag}px, 0)` : "";
      frame = lag ? requestAnimationFrame(animate) : 0;
    };
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - previousY;
      previousY = currentY;
      if (!delta) return;
      if (stickyTop !== undefined && element.getBoundingClientRect().top - lag > stickyTop + 2) return;
      lag = Math.max(-48, Math.min(48, lag - delta));
      element.style.transform = `translate3d(0, ${lag}px, 0)`;
      if (!frame) frame = requestAnimationFrame(animate);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      element.style.transform = "";
    };
  }, [stickyTop, active]);
  return ref;
}
