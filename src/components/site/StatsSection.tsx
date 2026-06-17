"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { STATS } from "@/lib/site/content";

function AnimatedNumber({
  value,
  suffix,
  decimals = 0,
  text,
}: {
  value: number;
  suffix: string;
  decimals?: number;
  text?: boolean;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const [display, setDisplay] = useState(text ? "Caucaia" : "0");

  useEffect(() => {
    if (text) {
      setDisplay("Caucaia");
      return;
    }
    if (!inView || reduced) {
      setDisplay(decimals ? value.toFixed(decimals) : String(value));
      return;
    }
    let frame: number;
    const duration = 1400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = value * eased;
      setDisplay(decimals ? current.toFixed(decimals) : String(Math.round(current)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, decimals, reduced, text]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="bg-[#1A1A2E] py-14 md:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-2xl">{stat.icon}</p>
            <p className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-white sm:text-4xl">
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
                decimals={"decimals" in stat ? stat.decimals : 0}
                text={"text" in stat ? stat.text : false}
              />
            </p>
            <p className="mt-1 text-sm font-medium text-white/60">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
