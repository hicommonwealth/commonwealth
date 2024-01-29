import React from 'react';

import { getClasses } from './helpers';
import { ComponentType } from './types';

import 'components/component_kit/cw_text.scss';

type FontWeight =
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'black'
  | 'italic'
  | 'link'
  | 'uppercase';

type FontStyle = 'italic' | 'uppercase';

type FontType =
  | 'd1'
  | 'd2'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'b1'
  | 'b2'
  | 'caption'
  | 'buttonSm'
  | 'buttonLg'
  | 'buttonMini'
  | 'monospace1'
  | 'monospace2';

type TextStyleProps = {
  className?: string;
  disabled?: boolean;
  fontStyle?: FontStyle;
  fontWeight?: FontWeight;
  isCentered?: boolean;
  noWrap?: boolean; // parent must be flex container and have definite width for this to work
  type?: FontType;
  truncate?: boolean;
};

type TextProps = TextStyleProps &
  React.PropsWithChildren &
  React.HTMLAttributes<HTMLDivElement>;

const getFontWeight = (type: FontType) => {
  if (type === 'buttonSm' || type === 'buttonLg') {
    return 'semiBold';
  } else if (type === 'buttonMini') {
    return 'medium';
  } else {
    return 'regular';
  }
};

export const CWText = ({
  className,
  disabled = false,
  isCentered,
  fontStyle,
  onClick,
  noWrap = false,
  title,
  type = 'b1',
  fontWeight = getFontWeight(type),
  truncate = false,
  children,
  ...otherProps
}: TextProps) => {
  return (
    <div
      className={getClasses<TextStyleProps & { onClick?: boolean }>(
        {
          type,
          fontWeight,
          disabled,
          fontStyle,
          noWrap,
          onClick: !!onClick,
          isCentered,
          className,
          truncate,
        },
        ComponentType.Text,
      )}
      title={title ? title.toString() : undefined}
      onClick={onClick}
      {...otherProps}
    >
      {children}
    </div>
  );
};
