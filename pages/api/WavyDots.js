import React, { useRef, useEffect, useState } from 'react';

const MagneticSticks = ({
  spacing = 25,
  stickLength = 8,
  stickWidth = 2,
  speed = 0.0001,
  fieldStrength = 0.01,
  color1 = '#fe4faf',
  color2 = '#f2fe4f',
  color3 = '#4facfe',
  sparsityFactor = 1.2,
  waveAmplitude = 4,
  waveFrequency = 0.03,
  // תוספות לשליטה בזוהר
  glowIntensity = 8, // עוצמת הזוהר (blur radius) - ערך נמוך לאפקט חלש
  glowColorOverride = null // אופציונלי: צבע זוהר שונה
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const rgb3 = hexToRgb(color3);

    const lerpRGB = (c1, c2, percent) => {
      const r = Math.round(c1.r + percent * (c2.r - c1.r));
      const g = Math.round(c1.g + percent * (c2.g - c1.g));
      const b = Math.round(c1.b + percent * (c2.b - c1.b));
      return `rgb(${r}, ${g}, ${b})`;
    };

    const getGradientColor = (percent) => {
      if (percent < 0.5) return lerpRGB(rgb1, rgb2, percent * 2);
      return lerpRGB(rgb2, rgb3, (percent - 0.5) * 2);
    };

    const stableRandom = (x, y) => {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return n - Math.floor(n);
    };

    const safeSpacing = Math.max(10, spacing);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * speed;
      const waveTime = Date.now() * 0.001; 

      for (let y = 0; y < canvas.height; y += safeSpacing) {
        const normalizedY = y / canvas.height;
        const drawProbability = normalizedY * normalizedY;
        const rowColor = getGradientColor(normalizedY); 

        for (let x = 0; x < canvas.width; x += safeSpacing) {
          
          if (stableRandom(x, y) < drawProbability * sparsityFactor) {
            
            const angle = Math.sin(x * fieldStrength + time) * 2 + 
                          Math.cos(y * fieldStrength - time) * 2;

            const offsetX = Math.sin(y * waveFrequency + waveTime) * waveAmplitude;
            const offsetY = Math.cos(x * waveFrequency + waveTime) * waveAmplitude;

            ctx.save();
            ctx.translate(x + offsetX, y + offsetY);
            ctx.rotate(angle);
            
            ctx.beginPath();
            ctx.moveTo(-stickLength / 2, 0);
            ctx.lineTo(stickLength / 2, 0);
            
            ctx.strokeStyle = rowColor;
            ctx.lineWidth = stickWidth;
            ctx.lineCap = 'round';

            // הוספת אפקט זוהר חלש
            ctx.shadowColor = glowColorOverride || rowColor; // משתמשים בצבע המקל או בצבע שונה
            ctx.shadowBlur = glowIntensity; // שולטים בעוצמה
            ctx.shadowOffsetX = 0; // ממרכזים את הזוהר
            ctx.shadowOffsetY = 0;

            ctx.stroke();
            
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [spacing, stickLength, stickWidth, speed, fieldStrength, color1, color2, color3, sparsityFactor, waveAmplitude, waveFrequency, glowIntensity, glowColorOverride, dimensions]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0].contentRect) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);

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