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
    <button className="FloatingActionButton" onClick={onClick}>
      {children}
    </button>
  );
};
