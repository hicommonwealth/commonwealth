import React from 'react';
import './TooltipIndicator.scss';

type TooltipIndicatorProps = Readonly<{
  label: string;
}>;

export const TooltipIndicator = (props: TooltipIndicatorProps) => {
  const { label } = props;
  return (
    <div className="TooltipIndicator">
      <div className="inner">{label}</div>
    </div>
  );
};
