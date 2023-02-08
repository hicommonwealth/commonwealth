import React from 'react';

import { CWIcon } from './cw_icons/cw_icon';
import type { IconComponentProps } from './cw_icons/types';
import { ComponentType } from './types';

export const CWIconButton = (props: IconComponentProps) => {
  const {
    componentType = ComponentType.IconButton,
    disabled = false,
    iconButtonTheme = 'neutral',
    iconName,
    iconSize = 'medium',
    onClick,
    selected = false,
    ...otherProps
  } = props;

  return (
    <CWIcon
      className={iconButtonTheme}
      componentType={componentType}
      disabled={disabled}
      iconName={iconName}
      iconSize={iconSize}
      onClick={onClick}
      selected={selected}
      {...otherProps}
    />
  );
};
