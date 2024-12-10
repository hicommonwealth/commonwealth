import React from 'react';

import './FloatingActionButton.scss';

type FloatingActionButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export const FloatingActionButton = ({
  children,
  onClick,
}: FloatingActionButtonProps) => {
  return (
    <div className="FloatingActionButton" onClick={onClick}>
      {children}
    </div>
  );
};
