import React, { useRef, useState } from "react";

// ============================================================
// ה-SVG filter (ללא שינוי)
// ============================================================
export function GlassFilterDefs({
  id = "liquid-glass-filter",
  baseFrequency = 0.02,
  numOctaves = 1,
  scale = 20,
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="turbulence"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

// ============================================================
// קומפוננטת ה-wrapper
// ============================================================
export default function GlassEffect({
  children,
  className = "",
  style = {},
  borderRadius = 24,
  filterId = "liquid-glass-filter",
  backdropFilter,
  tint = "hsl(0 0% 100% / 0%)",
  // glowColor = "rgba(255, 232, 101, 0.14)", 
  // activeGlowColor = "rgba(255, 237, 134, 0.23)", 
  glowColor = "rgba(255, 255, 255, 0.07)",
  activeGlowColor = "rgba(255, 255, 255, 0.07)",
  glowSize = "150px"
}) {
  const resolvedBackdropFilter = backdropFilter || `url(#${filterId}) brightness(1.12)`;

  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    containerRef.current.style.setProperty("--mouse-x", `${x}px`);
    containerRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={{
        position: "relative",
        borderRadius,
        overflow: "hidden",
        isolation: "isolate",
        cursor: "pointer",
        ...style,
      }}
    >
      {/* 1. שכבת הזכוכית המקורית */}
      <div
        className="glass-effect__backdrop"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          backdropFilter: resolvedBackdropFilter,
          WebkitBackdropFilter: resolvedBackdropFilter,
          background: tint,
          zIndex: -1,
        }}
      />

      {/* 2. שכבת הזוהר הרגילה (Hover) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background: `radial-gradient(circle ${glowSize} at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 80%)`,
          opacity: isHovered && !isActive ? 1 : 0, // מסתירים בעת לחיצה כדי למנוע ערבוב צבעים
          transition: "opacity 0.3s ease",
          zIndex: 0,
        }}
      />

      {/* 3. שכבת הזוהר המוארת (Active/Click) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background: `radial-gradient(circle ${glowSize} at var(--mouse-x, 50%) var(--mouse-y, 50%), ${activeGlowColor}, transparent 80%)`,
          opacity: isActive ? 1 : 0,
          transition: "opacity 0.3s ease", // מעבר מהיר יותר בלחיצה
          zIndex: 0,
        }}
      />

      {/* fallback ל-Safari/Firefox */}
      <style>{`
        @supports not (backdrop-filter: url(#${filterId})) {
          .glass-effect__backdrop {
            backdrop-filter: blur(14px) saturate(160%) !important;
            -webkit-backdrop-filter: blur(14px) saturate(160%) !important;
          }
        }
      `}</style>

      {/* 4. שכבת התוכן בפועל */}
      <div style={{ position: "relative", zIndex: 1, borderRadius: "inherit" }}>
        {children}
      </div>
    </div>
  );
}