import React from 'react';

const AmbientBackground = ({ baseColor = '#1a237e', opacity = 0.6 }) => {
  return (
    <div 
      className="ambient-background-layer" 
      style={{ 
        '--base-color': baseColor,
        '--glow-opacity': opacity 
      }}
    >
      {/* <div className="glow-blob blob-1"></div> */}
      <div className="glow-blob blob-2"></div>
      <div className="glow-blob blob-3"></div>
    </div>
  );
};

export default AmbientBackground;