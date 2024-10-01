import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import './OverflowIndicator.scss';

export type OverflowIndicatorProps = Readonly<{
  dir: 'left' | 'right';
  style?: React.CSSProperties;
  onClick?: () => void;
}>;

function upperFirst(text: string) {
  return text[0].toUpperCase() + text.substring(1);
}

export const OverflowIndicator = (props: OverflowIndicatorProps) => {
  const { onClick, style, dir } = props;

  const iconName = dir === 'right' ? 'caretRight' : 'caretLeft';

  const className = 'OverflowIndicator' + upperFirst(dir);

  return (
    <div className={'OverflowIndicator' + ' ' + className} style={style}>
      {dir === 'right' && <div className="Gradient" />}
      <button onClick={onClick} style={{ height: style?.height }}>
        <CWIcon iconName={iconName} />
      </button>
      {dir === 'left' && <div className="Gradient" />}
    </div>
  );
};
