import React, { useRef, useEffect, useState } from 'react';

// פונקציות עזר מחוץ לקומפוננטה כדי למנוע יצירה מחדש בכל רינדור
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const lerpRGB = (c1, c2, percent) => {
  const r = Math.round(c1.r + percent * (c2.r - c1.r));
  const g = Math.round(c1.g + percent * (c2.g - c1.g));
  const b = Math.round(c1.b + percent * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
};

const stableRandom = (x, y) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const MagneticSticks = ({
  spacing = 25,
  stickLength = 8,
  stickWidth = 2.5,
  speed = 0.0001,
  fieldStrength = 0.01,
  color1 = '#E81F63',
  color2 = '#00C752',
  color3 = '#FF3C02',

  // color1 = '#ff0000',
  // color2 = '#cc00ff',
  // color3 = '#8efbff',
  sparsityFactor = 1.2,
  waveAmplitude = 4,
  waveFrequency = 0.03,
  glowIntensity = 8,
  glowColorOverride = null
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const gridRef = useRef([]);

  // חישוב מראש של המקלות והצבעים (רץ רק כשמשנים הגדרות גלובליות או גודל חלון)
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const rgb3 = hexToRgb(color3);

    const getGradientColor = (percent) => {
      if (percent < 0.5) return lerpRGB(rgb1, rgb2, percent * 2);
      return lerpRGB(rgb2, rgb3, (percent - 0.5) * 2);
    };

    const safeSpacing = Math.max(10, spacing);
    const newGrid = [];

    // לולאה חיצונית רצה על ציר ה-X (עמודות) כדי ליצור גרדיאנט אופקי
    for (let x = 0; x < dimensions.width; x += safeSpacing) {
      // חישוב אחוז מימין לשמאל (ימין = 0, שמאל = 1)
      const normalizedX = 1 - (x / dimensions.width);
      const colColor = getGradientColor(normalizedX);
      const colSticks = [];

      for (let y = 0; y < dimensions.height; y += safeSpacing) {
        // שמירה על ההיגיון המקורי - צפוף יותר בחלק התחתון
        const normalizedY = y / dimensions.height;
        const drawProbability = normalizedY * normalizedY;

        if (stableRandom(x, y) < drawProbability * sparsityFactor) {
          colSticks.push(y);
        }
      }

      if (colSticks.length > 0) {
        // קיבוץ לפי עמודות (X) במקום שורות
        newGrid.push({ x, color: colColor, sticks: colSticks });
      }
    }

    gridRef.current = newGrid;
  }, [dimensions, spacing, color1, color2, color3, sparsityFactor]);

  // לולאת האנימציה
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * speed;
      const waveTime = Date.now() * 0.001;
      const halfLength = stickLength / 2;

      ctx.lineWidth = stickWidth;
      ctx.lineCap = 'round';

      // ציור יעיל: אנחנו מציירים כל עמודה כיחידה אחת
      for (let i = 0; i < gridRef.current.length; i++) {
        const col = gridRef.current[i];

        ctx.beginPath();
        ctx.strokeStyle = col.color;

        if (glowIntensity > 0) {
          ctx.shadowColor = glowColorOverride || col.color;
          ctx.shadowBlur = glowIntensity;
        } else {
          ctx.shadowBlur = 0;
        }

        const x = col.x;

        for (let j = 0; j < col.sticks.length; j++) {
          const y = col.sticks[j];

          const angle = Math.sin(x * fieldStrength + time) * 2 +
            Math.cos(y * fieldStrength - time) * 2;

          const offsetX = Math.sin(y * waveFrequency + waveTime) * waveAmplitude;
          const offsetY = Math.cos(x * waveFrequency + waveTime) * waveAmplitude;

          const centerX = x + offsetX;
          const centerY = y + offsetY;

          // מתמטיקה במקום טרנספורמציות יקרות בקנבס
          const dx = Math.cos(angle) * halfLength;
          const dy = Math.sin(angle) * halfLength;

          ctx.moveTo(centerX - dx, centerY - dy);
          ctx.lineTo(centerX + dx, centerY + dy);
        }

        // קריאה אחת בלבד ל-stroke עבור כל עמודה, מה ששומר על הביצועים
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stickLength, stickWidth, speed, fieldStrength, waveAmplitude, waveFrequency, glowIntensity, glowColorOverride]);

  // טיפול בשינויי גודל הקונטיינר
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0].contentRect) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block', backgroundColor: 'transparent' }}
      />
    </div>
  );
};

export default MagneticSticks;