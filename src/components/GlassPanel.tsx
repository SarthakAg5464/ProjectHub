import React, { CSSProperties } from 'react';

export default function GlassPanel({ children, style, className = '' }: { children: React.ReactNode, style?: CSSProperties, className?: string }) {
  return (
    <div className={`glass-panel ${className}`} style={style}>
      {children}
    </div>
  );
}
