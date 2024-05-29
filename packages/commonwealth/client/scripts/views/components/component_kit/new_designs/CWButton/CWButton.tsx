import React from 'react';

import { CWIcon } from '../../cw_icons/cw_icon';
import type { IconName } from '../../cw_icons/cw_icon_lookup';
import { CWText } from '../../cw_text';
import { getClasses } from '../../helpers';
import type { BaseStyleProps } from '../../types';
import { ComponentType } from '../../types';

import './CWButton.scss';

export type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonHeight = 'lg' | 'med' | 'sm';
type ButtonWidth = 'narrow' | 'wide' | 'full';
type ButtonAlt = 'green' | 'rorange';

type ButtonStyleProps = {
  buttonType?: ButtonType;
  buttonHeight?: ButtonHeight;
  buttonWidth?: ButtonWidth;
  buttonAlt?: ButtonAlt;
} & BaseStyleProps;

export type ButtonProps = {
  iconLeft?: IconName;
  iconLeftWeight?: 'bold' | 'light' | 'fill';
  iconRight?: IconName;
  label: string | React.ReactNode;
  type?: 'reset' | 'submit' | 'button';
  containerClassName?: string;
} & ButtonStyleProps &
  React.HTMLAttributes<HTMLButtonElement> & { form?: string };

export const CWButton = (props: ButtonProps) => {
  const {
    buttonType = 'primary',
    buttonHeight = 'med',
    buttonWidth = 'narrow',
    buttonAlt,
    className,
    disabled = false,
    iconLeft,
    iconLeftWeight,
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
            buttonAlt,
            buttonHeight,
            buttonWidth,
            className,
          },
          ComponentType.Button,
        )}
        onClick={onClick}
        disabled={disabled}
        {...otherProps}
      >
        {!!iconLeft && (
          <CWIcon
            weight={iconLeftWeight}
            iconName={iconLeft}
            className="button-icon"
          />
        )}
        <CWText
          type={buttonHeight === 'lg' ? 'buttonLg' : 'buttonSm'}
          className="button-text"
          noWrap
        >
          {label}
        </CWText>
        {!!iconRight && <CWIcon iconName={iconRight} className="button-icon" />}
      </button>
    </div>
  );
};
