import React, { ReactNode } from 'react';

import './Indicator.scss';

export type IndicatorProps = Readonly<{
  children: ReactNode;
}>;

export const Indicator = (props: IndicatorProps) => {
  const { children } = props;
  return (
    <div className="Indicator">
      <div className="inner">{children}</div>
    </div>
  );
};
