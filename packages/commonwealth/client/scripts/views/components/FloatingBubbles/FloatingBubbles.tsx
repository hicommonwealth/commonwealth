import React from 'react';
import './FloatingBubbles.scss';

interface FloatingBubblesProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'normal' | 'fast';
}

const FloatingBubbles = ({
  className = '',
  intensity = 'medium',
  speed = 'normal',
}: FloatingBubblesProps) => {
  return (
    <div
      className={`FloatingBubbles ${intensity} ${speed} ${className}`}
      aria-hidden="true"
    />
  );
};

export default FloatingBubbles;
