import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function useAnimatedNumber(value: number, duration = 600) {
  const [animated, setAnimated] = useState(value);
  const previous = useRef(value);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const startValue = previous.current;
    if (startValue === value || reduced || duration <= 0) {
      setAnimated(value);
      previous.current = value;
      return;
    }

    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(startValue + (value - startValue) * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return animated;
}

export function formatRelativeTime(timestamp: number | string) {
  const ms = typeof timestamp === "string" ? Date.parse(timestamp) : timestamp;
  if (!Number.isFinite(ms)) return typeof timestamp === "string" ? timestamp : "Just now";

  const diff = Math.round((Date.now() - ms) / 1000);
  if (diff < 10) return "Just now";
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function useRelativeClock(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useStaggerReady(delay = 40) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);
  return ready;
}

export function useFlashOnChange(value: string | number | null | undefined, duration = 700) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value || value == null) {
      prev.current = value;
      return;
    }
    prev.current = value;
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), duration);
    return () => window.clearTimeout(id);
  }, [value, duration]);

  return flash;
}

export function useRipple() {
  return useCallback((event: ReactMouseEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  }, []);
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
