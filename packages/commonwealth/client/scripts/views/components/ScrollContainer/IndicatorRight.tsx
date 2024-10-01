import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export type IndicatorRightProps = Readonly<{
  style?: React.CSSProperties;
}>;

export const IndicatorRight = (props: IndicatorRightProps) => {
  return (
    <div className="OverflowIndicatorRight" {...props}>
      <CWIcon iconName="caretRight" />
    </div>
  );
};
