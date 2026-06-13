import React, { useState, useRef } from 'react';

const TooltipWrapper = ({ children, text, shortcut, color }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const childRef = useRef(null);

  const handleMouseEnter = () => {
    const rect = childRef.current?.getBoundingClientRect();
    if (!rect) return;

    setCoords({
      left: rect.left + rect.width / 2,
      top: rect.top - 10,
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const child = React.cloneElement(children, {
    ref: childRef,
    onMouseEnter: (event) => {
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(event);
      }
      handleMouseEnter();
    },
    onMouseLeave: (event) => {
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(event);
      }
      handleMouseLeave();
    }
  });

  return (
    <>
      {child}
      {showTooltip && (
        <div style={{
          position: 'fixed',
          left: coords.left,
          top: coords.top,
          transform: 'translate(-60%, -170%)',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            minWidth: '180px'
          }}>
            <div style={{
              backgroundColor: color || '#304b27',
              color: '#ffffff',
              //move right a bit
              marginLeft: '90px',
              padding: '0px 6px',
              fontSize: '17px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 500,
              direction: 'ltr',
              whiteSpace: 'nowrap',
              // borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              minWidth: '110px'
            }}>
              {text}
            </div>
            <div style={{
              position: 'absolute',
              left: '75px',
              top: '65%',
              transform: 'translateY(-30%)',
              backgroundColor: '#ffffff',
              color: '#111111',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'Arial, sans-serif',
              // borderRadius: '10px',
              boxShadow: '0 14px 35px rgba(0, 0, 0, 0.18)',
              whiteSpace: 'nowrap',
              direction: 'ltr'
            }}>
              {shortcut}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TooltipWrapper;