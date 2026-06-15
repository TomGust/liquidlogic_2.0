import React, { useRef, useEffect, forwardRef } from 'react';

// פונקציית עזר למיזוג ה-Refs (עבור ה-Tooltip והכפתור)
const mergeRefs = (...refs) => {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref != null) {
        ref.current = node;
      }
    });
  };
};

const interpolate = (current, target, factor) => {
  return current + (target - current) * factor;
};

const MagneticElement = forwardRef(({ children, pullRadius = 150, strength = 0.2, smoothing = 0.15, ...props }, forwardedRef) => {
  const elementRef = useRef(null);
  
  // מיזוג הרפרנסים - שומר על ה-Tooltip ועל האלמנט המקורי ביחד
  const combinedRef = mergeRefs(elementRef, forwardedRef, children.ref);

  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      
      // מחשבים את המרכז הסטטי. מכיוון שאנחנו לא נוגעים ב-transform,
      // שינוי הגודל (Scale) מה-CSS לא משפיע על חישוב נקודת האמצע!
      const centerX = rect.left - currentPos.current.x + rect.width / 2;
      const centerY = rect.top - currentPos.current.y + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < pullRadius) {
        targetPos.current = { 
          x: distX * strength, 
          y: distY * strength 
        };
      } else {
        targetPos.current = { x: 0, y: 0 };
      }
    };

    const animateLoop = () => {
      currentPos.current.x = interpolate(currentPos.current.x, targetPos.current.x, smoothing);
      currentPos.current.y = interpolate(currentPos.current.y, targetPos.current.y, smoothing);

      if (elementRef.current) {
        // קסם ה-CSS המודרני: משתמשים במאפיין ה-translate הישיר.
        // זה משאיר את ה-transform פנוי לחלוטין עבור ה-scale(:hover) שב-CSS שלך!
        elementRef.current.style.translate = `${currentPos.current.x.toFixed(2)}px ${currentPos.current.y.toFixed(2)}px`;
      }

      rafId.current = requestAnimationFrame(animateLoop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafId.current = requestAnimationFrame(animateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [pullRadius, strength, smoothing]);

  // מחזיר את הכפתור המקורי בדיוק כפי שהוא, ללא שום שכבת HTML נוספת
  return React.cloneElement(children, {
    ...props, // מעביר את האירועים של ה-Tooltip
    ref: combinedRef,
  });
});

MagneticElement.displayName = 'MagneticElement';

export default MagneticElement;