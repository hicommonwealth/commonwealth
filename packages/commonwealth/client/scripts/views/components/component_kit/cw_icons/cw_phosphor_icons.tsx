/* eslint-disable max-len */
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import React from 'react';
import '../cw_icon_button.scss';
import { getClasses } from '../helpers';
import './cw_icon.scss';
import type { IconProps, IconStyleProps } from './types';

export const withPhosphorIcon = (Icon: PhosphorIcon) => {
  function wrapper(props: IconProps) {
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
  }

  return wrapper;
};
