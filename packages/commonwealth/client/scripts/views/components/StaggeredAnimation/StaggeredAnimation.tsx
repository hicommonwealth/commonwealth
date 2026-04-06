import React from 'react';
import './StaggeredAnimation.scss';

interface StaggeredAnimationProps {
  children: React.ReactNode[];
  className?: string;
  animationType?: 'sparkle' | 'float' | 'bounce' | 'fade';
  delay?: number;
  duration?: number;
}

const StaggeredAnimation = ({
  children,
  className = '',
  animationType = 'sparkle',
  delay = 0.2,
  duration = 1,
}: StaggeredAnimationProps) => {
  return (
    <div className={`StaggeredAnimation ${className}`}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`staggered-item ${animationType}`}
          style={{
            animationDelay: `${index * delay}s`,
            animationDuration: `${duration}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default StaggeredAnimation;
