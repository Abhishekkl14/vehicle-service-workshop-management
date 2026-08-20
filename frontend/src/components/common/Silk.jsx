import React, { useEffect, useState } from "react";
import "./Silk.css";

export default function Silk(props) {
  const {
    width = "1080px",
    height = "1080px",
    speed = 5,
    scale = 1,
    color = "#6ce1c4",
    noiseIntensity = 1.5,
    rotation = 0,
    ...rest
  } = props;

  const [Lib, setLib] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Build the package name at runtime so Vite cannot statically analyze it.
    const pkg = "@react" + "-bits/Silk-JS-CSS";
    // Prevent Vite from trying to pre-bundle or statically resolve this optional package
    // @vite-ignore
    import(/* @vite-ignore */ pkg)
      .then((mod) => {
        if (!cancelled) setLib(() => mod.default || mod);
      })
      .catch(() => {
        // keep fallback
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="silk-container" aria-hidden="true">
      {Lib ? (
        <div style={{ width, height, position: "relative" }}>
          <Lib
            speed={speed}
            scale={scale}
            color={color}
            noiseIntensity={noiseIntensity}
            rotation={rotation}
            {...rest}
          />
        </div>
      ) : (
        <div
          className="silk-fallback"
          style={{ width, height, ["--silk-color"]: color }}
        />
      )}
    </div>
  );
}
