import React from 'react';

import 'components/component_kit/new_designs/cw_button.scss';

import { CWIcon } from '../../cw_icons/cw_icon';
import { IconName } from '../../cw_icons/cw_icon_lookup';
import { getClasses } from '../../helpers';
import type { BaseStyleProps } from '../../types';
import { ComponentType } from '../../types';

type ButtonSize = 'lg' | 'med' | 'sm';

type ButtonStyleProps = {
  buttonSize: ButtonSize;
  iconName: IconName;
} & BaseStyleProps;

type ButtonProps = ButtonStyleProps & React.HTMLAttributes<HTMLButtonElement>;

export const CWIconButton = (props: ButtonProps) => {
  const {
    buttonSize,
    iconName,
    className,
    disabled = false,
    onClick,
    ...otherProps
  } = props;

  return (
    <div
      className={getClasses({
        btnBorder: 'btn-border',
        buttonSize,
        disabled,
      })}
    >
      <button
        className={getClasses(
          {
            buttonSize,
            disabled,
            className,
          },
          ComponentType.Button,
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
