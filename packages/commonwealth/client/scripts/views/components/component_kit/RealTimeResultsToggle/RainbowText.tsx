import React, { ReactNode } from 'react';
import './RainbowText.scss';

type RainbowTextProps = {
  children: ReactNode;
  durationSeconds?: number; // seconds
};

const RainbowText = ({ children, durationSeconds = 5 }: RainbowTextProps) => {
  return (
    <span
      className="RainbowText"
      style={{
        animationDuration: `${durationSeconds}s`,
      }}
    >
      {children}
    </span>
  );
};

export default RainbowText;
export { RainbowText };
