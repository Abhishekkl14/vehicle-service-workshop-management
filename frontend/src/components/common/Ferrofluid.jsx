import React, { useEffect, useState } from "react";
import "./Ferrofluid.css";

// Dynamic import of the external Ferrofluid library so build doesn't fail if the package
// isn't present. If the package is available, render it; otherwise render a lightweight
// CSS fallback background so the app still has an animated background.
export default function Ferrofluid(props) {
  const [Lib, setLib] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Use a runtime dynamic import ignoring Vite's static analysis so the dev build
    // doesn't fail if the package isn't installed. At runtime this will either
    // load the package (if installed) or reject and fall back to CSS.
    const pkg = "@react-bits/Ferrofluid-JS-CSS";
    // @vite-ignore
    import(/* @vite-ignore */ pkg)
      .then((mod) => {
        if (!cancelled) setLib(() => mod.default || mod);
      })
      .catch(() => {
        // Package not available — keep fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ferrofluid-container" aria-hidden="true">
      {Lib ? (
        <Lib {...props} />
      ) : (
        <div className="ferrofluid-fallback" />
      )}
    </div>
  );
}
