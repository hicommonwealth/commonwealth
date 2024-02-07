import React from 'react';

import './CWCircleButton.scss';

import { CWIcon } from '../../cw_icons/cw_icon';
import type { IconName } from '../../cw_icons/cw_icon_lookup';
import { getClasses } from '../../helpers';
import type { BaseStyleProps } from '../../types';
import { ComponentType } from '../../types';

type CircleButtonType = 'primary' | 'secondary';

type CircleButtonStyleProps = {
  buttonType?: CircleButtonType;
} & BaseStyleProps;

export type CircleButtonProps = {
  iconName: IconName;
  containerClassName?: string;
} & CircleButtonStyleProps &
  React.HTMLAttributes<HTMLButtonElement>;

export const CWCircleButton = (props: CircleButtonProps) => {
  const {
    className,
    iconName,
    buttonType,
    disabled = false,
    onClick,
    ...otherProps
  } = props;

  return (
    <div
      className={getClasses({
        circleBtnBorder: 'circle-btn-border',
        buttonType,
        disabled,
      })}
    >
      <button
        className={getClasses(
          {
            disabled,
            className,
            buttonType,
          },
          ComponentType.CircleButton,
        )}
        onClick={onClick}
        disabled={disabled}
        {...otherProps}
      >
        <CWIcon iconName={iconName} className="button-icon" />
      </button>
    </div>
  );
};
