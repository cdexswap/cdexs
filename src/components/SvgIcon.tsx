'use client';

import React from 'react';

interface SvgIconProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function SvgIcon({ src, alt, width, height, className = '' }: SvgIconProps) {
  return (
    <img 
      src={src} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
