import React from 'react';

import 'components/component_kit/new_designs/cw_button.scss';

import { CWIcon } from '../cw_icons/cw_icon';
import type { IconName } from '../cw_icons/cw_icon_lookup';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import type { BaseStyleProps } from '../types';
import { ComponentType } from '../types';

export type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'destructive';

type ButtonHeight = 'lg' | 'med' | 'sm';

type ButtonWidth = 'narrow' | 'wide' | 'full';

type ButtonStyleProps = {
  buttonType?: ButtonType;
  buttonHeight?: ButtonHeight;
  buttonWidth?: ButtonWidth;
} & BaseStyleProps;

export type ButtonProps = {
  iconLeft?: IconName;
  iconRight?: IconName;
  label: string | React.ReactNode;
  type?: 'reset' | 'submit' | 'button';
  containerClassName?: string;
} & ButtonStyleProps &
  React.HTMLAttributes<HTMLButtonElement>;

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
    containerClassName,
    ...otherProps
  } = props;

  return (
    <div
      className={getClasses({
        btnBorder: 'btn-border',
        buttonType,
        disabled,
        buttonWidth: buttonWidth === 'full' ? 'full' : '',
        containerClassName,
      })}
    >
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
        {!!iconLeft && <CWIcon iconName={iconLeft} className="button-icon" />}
        <CWText type={'buttonMini'} className="button-text" noWrap>
          {label}
        </CWText>
        {!!iconRight && <CWIcon iconName={iconRight} className="button-icon" />}
      </button>
    </div>
  );
};
