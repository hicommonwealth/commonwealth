import React from 'react';

import 'components/component_kit/new_designs/cw_button.scss';

import type { IconName } from '../cw_icons/cw_icon_lookup';
import { CWIcon } from '../cw_icons/cw_icon';
import type { BaseStyleProps } from '../types';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { CWText } from '../cw_text';

type ButtonType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive';

type ButtonHeight =
  | 'lg'
  | 'med'
  | 'sm';

type ButtonWidth =
  | 'narrow'
  | 'wide';

type ButtonStyleProps = {
  buttonType?: ButtonType;
  buttonHeight?: ButtonHeight;
  buttonWidth?: ButtonWidth;
} & BaseStyleProps;

export type ButtonProps = {
  iconLeft?: IconName;
  iconRight?: IconName;
  label: string | React.ReactNode;
} & ButtonStyleProps &
  React.HTMLAttributes<HTMLButtonElement>;

const getTextType = (buttonType: ButtonType) => {
  if (buttonType.slice(0, 2) === 'lg') {
    return 'buttonLg';
  } else if (buttonType.slice(0, 4) === 'mini') {
    return 'buttonMini';
  } else {
    return 'buttonSm';
  }
};

export const CWButton = (props: ButtonProps) => {
  const {
    buttonType = 'primary',
    buttonHeight = 'med',
    buttonWidth = 'narrow',
    className,
    disabled = false,
    iconLeft,
    iconRight,
    label,
    onClick,
    ...otherProps
  } = props;

  return (
    <div className={`btn-border ${buttonType} ${disabled ? 'disabled' : ''}`}>
      <button
        className={getClasses<ButtonStyleProps>(
          {
            disabled,
            buttonType,
            buttonHeight,
            buttonWidth,
            className,
          },
          ComponentType.Button
        )}
        onClick={onClick}
        disabled={disabled}
        {...otherProps}
      >
        {!!iconLeft && (
          <CWIcon iconName={iconLeft} className="button-icon" />
        )}
        <CWText type={getTextType(buttonType)} className="button-text" noWrap>
          {label}
        </CWText>
        {!!iconRight && (
          <CWIcon iconName={iconRight} className="button-icon" />
        )}
      </button>
    </div>
  );
};
