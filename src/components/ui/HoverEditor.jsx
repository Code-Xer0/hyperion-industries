import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';

export default function HoverEditor({ model, index = null, children }) {
  const { isEditMode, setActiveEditConfig } = useEditor();
  const [isHovered, setIsHovered] = useState(false);

  if (!import.meta.env.DEV || !isEditMode) return children;

  return (
    <div 
      style={{
        position: 'relative',
        display: 'block', // Changed from inline-block to block for better grid integration
        width: '100%',
        height: '100%',
        outline: isHovered ? '2px solid #ffc72c' : 'none',
        outlineOffset: '-2px', // Inside the boundary
        transition: 'all 0.16s ease',
        cursor: 'default',
        zIndex: isHovered ? 10 : 1
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 199, 44, 0.05)',
          pointerEvents: 'none',
          zIndex: 2
        }} />
      )}
      {isHovered && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveEditConfig({ model, index });
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#ffc72c',
            color: '#000',
            border: 'none',
            borderRadius: '4px', // Squared off slightly for premium feel
            padding: '6px 12px',
            fontSize: '10px',
            fontFamily: 'var(--font-display, monospace)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '12px' }}>✎</span> Edit
        </button>
      )}
      <div style={{ 
        opacity: isHovered ? 0.85 : 1, 
        transition: 'opacity 0.16s ease',
        height: '100%' 
      }}>
        {children}
      </div>
    </div>
  );
}
