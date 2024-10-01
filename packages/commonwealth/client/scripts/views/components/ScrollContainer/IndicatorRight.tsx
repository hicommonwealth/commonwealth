import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export type IndicatorRightProps = Readonly<{
  style?: React.CSSProperties;
  onClick?: () => void;
}>;

export const IndicatorRight = (props: IndicatorRightProps) => {
  const { onClick, style } = props;
  return (
    <div className="OverflowIndicator OverflowIndicatorRight" {...props}>
      <div className="Gradient" />
      <button onClick={onClick} style={{ height: style?.height }}>
        <CWIcon iconName="caretRight" />
      </button>
    </div>
  );
};
