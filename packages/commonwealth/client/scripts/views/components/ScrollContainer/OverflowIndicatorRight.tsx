import React from 'react';
import {
  OverflowIndicator,
  OverflowIndicatorProps,
} from 'views/components/ScrollContainer/OverflowIndicator';

export const OverflowIndicatorRight = (
  props: Pick<OverflowIndicatorProps, 'onClick' | 'style'>,
) => {
  const { onClick, style } = props;
  return (
    <OverflowIndicator
      className="OverflowIndicatorRight"
      iconName="caretRight"
      onClick={onClick}
      style={style}
    />
  );
};
