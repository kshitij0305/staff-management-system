"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

export function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = `${Math.round(latest).toLocaleString("en-IN")}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
