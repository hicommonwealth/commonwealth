import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import './OverflowIndicator.scss';

export type OverflowIndicatorProps = Readonly<{
  iconName: IconName;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}>;

export const OverflowIndicator = (props: OverflowIndicatorProps) => {
  const { onClick, style, className, iconName } = props;
  return (
    <div className={'OverflowIndicator' + ' ' + className} style={style}>
      <div className="Gradient" />
      <button onClick={onClick} style={{ height: style?.height }}>
        <CWIcon iconName={iconName} />
      </button>
    </div>
  );
};
