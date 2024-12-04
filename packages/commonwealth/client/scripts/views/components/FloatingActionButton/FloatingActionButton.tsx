import React from 'react';

type FloatingActionButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export const FloatingActionButton = (props: FloatingActionButtonProps) => {
  const { onClick } = props;

  return (
    <div className="FloatingActionButton" onClick={onClick}>
      {props.children}
    </div>
  );
};
