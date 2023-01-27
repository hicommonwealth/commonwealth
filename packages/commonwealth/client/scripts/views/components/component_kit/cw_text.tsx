/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_text.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

type FontWeight =
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'black'
  | 'italic'
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
  | 'buttonMini';

type TextStyleProps = {
  className?: string;
  disabled?: boolean;
  fontStyle?: FontStyle;
  fontWeight?: FontWeight;
  isCentered?: boolean;
  noWrap?: boolean; // parent must be flex container and have definite width for this to work
  type?: FontType;
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

export const CWText = (props: TextProps) => {
  const {
    className,
    disabled = false,
    isCentered,
    fontStyle,
    onClick,
    noWrap = false,
    title,
    type = 'b1',
    fontWeight = getFontWeight(type),
    ...otherProps
  } = props;

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
        },
        ComponentType.Text
      )}
      title={title ? title.toString() : undefined}
      onClick={onClick}
      {...otherProps}
    >
      {props.children}
    </div>
  );
};
