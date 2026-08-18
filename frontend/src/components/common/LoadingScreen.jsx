import { useEffect, useState, useRef } from "react";

const PHRASES = [
  "Preparing your workspace",
  "Loading your vehicles",
  "Almost ready",
];

export default function LoadingScreen({
  onComplete,
  duration = 2400,
}) {
  const [percent, setPercent] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(
        elapsed / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 3);
      setPercent(Math.round(eased * 100));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(
          animate
        );
      } else {
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(
      animate
    );

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [duration, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(
        (prev) => (prev + 1) % PHRASES.length
      );
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const digits = String(percent)
    .padStart(3, "0")
    .split("");

  return (
    <div className="loading-screen-overlay">
      <div className="loading-screen-content">

        {/* Phrase */}

        <p className="loading-screen-phrase">
          {PHRASES[phraseIndex]}
        </p>

        {/* Progress bar */}

        <div className="loading-screen-bar-track">
          <div
            className="loading-screen-bar-fill"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Counter */}

        <div className="loading-screen-counter">
          <div className="loading-screen-digits">
            {digits.map((d, i) => (
              <div
                className="loading-screen-digit"
                key={i}
              >
                <div
                  className="loading-screen-digit-inner"
                  style={{
                    transform: `translateY(-${d * 10}%)`,
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                    (n) => (
                      <span key={n}>{n}</span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <span className="loading-screen-percent">
            %
          </span>
        </div>

      </div>
    </div>
  );
}
