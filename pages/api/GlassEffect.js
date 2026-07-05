import React, { useRef, useState } from "react";

// ============================================================
// כאן ה-SVG filter שלך (נשאר ללא שינוי)
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
// קומפוננטת ה-wrapper המעודכנת עם אפקט הזוהר
// ============================================================
export default function GlassEffect({
  children,
  className = "",
  style = {},
  borderRadius = 24,
  filterId = "liquid-glass-filter",
  backdropFilter,
  tint = "hsl(0 0% 100% / 0%)",
  // הוספנו פרופים לשליטה על הזוהר:
  glowColor = "rgba(255, 232, 101, 0.14)", 
  glowSize = "150px"
}) {
  const resolvedBackdropFilter = backdropFilter || `url(#${filterId}) brightness(1.12)`;
  
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // פונקציה שעוקבת אחרי מיקום העכבר ומעדכנת משתני CSS
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
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        borderRadius,
        overflow: "hidden",
        isolation: "isolate",
        ...style,
      }}
    >
      {/* 1. שכבת הזכוכית המקורית (הפילטר) */}
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

      {/* 2. שכבת הזוהר שעוקבת אחרי העכבר */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none", // מונע מהשכבה הזו לחסום לחיצות על התוכן
          background: `radial-gradient(circle ${glowSize} at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 80%)`,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.3s ease", // מעבר חלק כשנכנסים/יוצאים עם העכבר
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

      {/* 3. שכבת התוכן בפועל */}
      <div style={{ position: "relative", zIndex: 1, borderRadius: "inherit" }}>
        {children}
      </div>
    </div>
  );
}