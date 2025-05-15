// Create a file DebugInfo.jsx in your components folder
import React, { useEffect, useState } from 'react';

const DebugInfo = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '70px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px 10px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '4px'
    }}>
      Screen: {screenSize.width}x{screenSize.height}px
    </div>
  );
};

export default DebugInfo;