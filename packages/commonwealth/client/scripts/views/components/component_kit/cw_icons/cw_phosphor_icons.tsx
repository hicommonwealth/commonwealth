/* eslint-disable max-len */
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import 'components/component_kit/cw_icon.scss';
import 'components/component_kit/cw_icon_button.scss';
import React from 'react';
import { getClasses } from '../helpers';
import type { IconProps, IconStyleProps } from './types';

// eslint-disable-next-line react/display-name
export const withPhosphorIcon = (Icon: PhosphorIcon) => (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    weight,
    ...otherProps
  } = props;

  return (
    <Icon
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType,
      )}
      onClick={otherProps.onClick}
      onMouseEnter={otherProps.onMouseEnter}
      onMouseLeave={otherProps.onMouseLeave}
      weight={weight}
    />
  );
};
