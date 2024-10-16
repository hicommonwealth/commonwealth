import React from 'react';

import './CWIconButton.scss';

import { IconComponentProps } from 'views/components/component_kit/cw_icons/types';
import { CWIcon } from '../../cw_icons/cw_icon';
import { IconName } from '../../cw_icons/cw_icon_lookup';
import { getClasses } from '../../helpers';
import type { BaseStyleProps } from '../../types';

type ButtonSize = 'lg' | 'med' | 'sm';

type ButtonStyleProps = {
  buttonSize?: ButtonSize;
  iconName: IconName;
} & BaseStyleProps &
  Pick<IconComponentProps, 'weight'>;

type ButtonProps = ButtonStyleProps & React.HTMLAttributes<HTMLButtonElement>;

export const CWIconButton = ({
  buttonSize = 'med',
  className,
  iconName,
  disabled = false,
  onClick,
  weight,
  ...otherProps
}: ButtonProps) => {
  return (
    <button
      className={getClasses(
        {
          buttonSize,
          disabled,
          className,
        },
        'CWIconButton',
      )}
      onClick={onClick}
      disabled={disabled}
      {...otherProps}
    >
      <CWIcon iconName={iconName} weight={weight} />
    </button>
  );
};
