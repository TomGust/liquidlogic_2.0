import { useState, useRef, useEffect } from 'react';
import { GlassFilterDefs } from './GlassEffect';
import GlassEffect from './GlassEffect';

const DEV_PANEL_FILTER_ID = 'dev-panel-glass-filter'; // ← ייחודי, לא מתנגש עם שימושים אחרים של GlassEffect באפליקציה

const SWATCH_KEYS = [
  { key: 'baseColor', label: 'צבע בסיס' },
  { key: 'background', label: 'רקע' },
  { key: 'tooltip', label: 'טולטיפ' },
  { key: 'highlightText', label: 'הדגשת טקסט' },
  { key: 'icon', label: 'אייקון' },
  { key: 'selectedNote', label: 'פתק נבחר' },
  { key: 'ambientColor', label: 'אפקט' },
];

export default function DevPanel({ devMode, setDevMode, devColors, setDevColors, aiUsage, setAiUsage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null }); // null = פינה ברירת מחדל דרך CSS

  const panelRef = useRef(null);
  const dragState = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const colorInputRef = useRef(null);
  const activeColorKeyRef = useRef(null);

  // ✅ פתיחה/סגירה עם קיצור מקלדת Ctrl+Shift+D
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ✅ גרירת הפאנל - מתחיל בלחיצה, זז עם העכבר, נעצר בשחרור
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragState.current.dragging) return;
      setPosition({
        x: e.clientX - dragState.current.offsetX,
        y: e.clientY - dragState.current.offsetY,
      });
    };
    const handleMouseUp = () => {
      dragState.current.dragging = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    // לא מתחילים גרירה אם לוחצים על טוגל/ריבוע/כפתור העתקה
    if (e.target.closest('.dp-no-drag')) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    e.preventDefault();
  };

  const openColorPicker = (key) => {
    activeColorKeyRef.current = key;
    if (colorInputRef.current) {
      colorInputRef.current.value = devColors[key] || '#000000';
      colorInputRef.current.click();
    }
  };

  const handleColorPicked = (e) => {
    const key = activeColorKeyRef.current;
    if (!key) return;
    setDevColors(prev => ({ ...prev, [key]: e.target.value }));
  };

  // ✅ מעתיק ל-clipboard בפורמט המדויק של אובייקט THEMES
  const handleCopy = () => {
    const themeObject = `{
    id: 0,
    name: "פיתוח",
    baseColor: "${devColors.baseColor}",
    background: "${devColors.background}",
    tooltip: "${devColors.tooltip}",
    highlightText: "${devColors.highlightText}",
    icon: "${devColors.icon}",
    selectedNote: "${devColors.selectedNote}",
    ambientColor: "${devColors.ambientColor}",
    ambientOpacity: 0.4
  }`;
    navigator.clipboard.writeText(themeObject).catch(() => { });
  };

  if (!isOpen) return null;

  const wrapperStyle = position.x !== null
    ? { top: position.y, left: position.x }
    : { bottom: 24, left: 24 };

  return (
    <>
      <GlassFilterDefs id={DEV_PANEL_FILTER_ID} baseFrequency={0.015} numOctaves={1} scale={12} />

      <div
        ref={panelRef}
        className="dev-panel"
        dir="rtl"
        style={wrapperStyle}
        onMouseDown={handleMouseDown}
      >
        <GlassEffect
          className="dev-panel-glass dp-no-drag-target"
          filterId={DEV_PANEL_FILTER_ID}
          borderRadius={20}
          tint="rgba(82, 82, 82, 0.2)"
          glowColor="rgba(0, 73, 73, 0.13)"
          activeGlowColor="rgba(0, 48, 78, 0.34)"
          // style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)' }}
        >
          <div className="dev-panel-inner">
            <div className="dev-panel-header">פאנל מפתח</div>

            <div className="dev-panel-row">
              <span>שימוש בAI דמה</span>
              <button
                className={`dp-toggle dp-no-drag ${aiUsage ? 'on' : ''}`}
                onClick={() => setAiUsage(prev => !prev)}
              />
            </div>

            <div className="dev-panel-row">
              <span>מצב מפתח</span>
              <button
                className={`dp-toggle dp-no-drag ${devMode ? 'on' : ''}`}
                onClick={() => setDevMode(prev => !prev)}
              />
            </div>

            <div className="dev-panel-colors-label">צבעים וסגנון</div>

            <div className="dev-panel-swatches">
              {SWATCH_KEYS.map(({ key, label }) => (
                <button
                  key={key}
                  title={label}
                  className="dp-swatch dp-no-drag"
                  style={{ backgroundColor: devColors[key] }}
                  onClick={() => openColorPicker(key)}
                />
              ))}
            </div>

            <input
              ref={colorInputRef}
              type="color"
              className="dp-hidden-color-input"
              onChange={handleColorPicked}
            />

            <div className="dev-panel-copy-row">
              <button className="dp-copy-button dp-no-drag" onClick={handleCopy}>
                העתק
              </button>
            </div>
          </div>
        </GlassEffect>
      </div>
    </>
  );
}