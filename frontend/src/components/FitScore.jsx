import { useEffect, useRef, useState } from "react";

// Scout's fit score out of 100. High ≥ 80, Mid 60–79, Low < 60.
function levelOf(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

const DURATION_MS = 1000;
const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SWEEP = 0.75 * CIRCUMFERENCE; // the gauge is three quarters of a circle, open at the bottom like a speedometer

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const easeOut = (t) => 1 - (1 - t) ** 3; // fast at first, settling at the end like a needle

// The score counts up from 0 while the gauge sweeps right, once, when it first scrolls into view.
export default function FitScore({ score }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(0);
  const reduced = prefersReducedMotion();
  const value = reduced ? score : shown;

  useEffect(() => {
    if (reduced) return;
    let frame;
    const animate = () => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        setShown(Math.round(score * easeOut(progress)));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate();
      },
      { threshold: 0.6 },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [score, reduced]);

  return (
    <span ref={ref} role="img" className={`fit-score fit-score--${levelOf(score)}`} aria-label={`Fit score ${score} out of 100`}>
      <svg className="fit-score__gauge" viewBox="0 0 44 44" aria-hidden="true">
        <circle className="fit-score__track" cx="22" cy="22" r={RADIUS} transform="rotate(135 22 22)" strokeDasharray={`${SWEEP} ${CIRCUMFERENCE}`} />
        <circle
          className="fit-score__fill"
          cx="22"
          cy="22"
          r={RADIUS}
          transform="rotate(135 22 22)"
          strokeDasharray={`${(SWEEP * value) / 100} ${CIRCUMFERENCE}`}
        />
      </svg>
      <span className="fit-score__value" aria-hidden="true">
        {value}
      </span>
    </span>
  );
}
