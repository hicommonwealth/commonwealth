import React from 'react';
import {
  OverflowIndicator,
  OverflowIndicatorProps,
} from 'views/components/ScrollContainer/OverflowIndicator';

export const OverflowIndicatorLeft = (
  props: Pick<OverflowIndicatorProps, 'onClick' | 'style'>,
) => {
  const { onClick, style } = props;
  return <OverflowIndicator dir="left" onClick={onClick} style={style} />;
};
