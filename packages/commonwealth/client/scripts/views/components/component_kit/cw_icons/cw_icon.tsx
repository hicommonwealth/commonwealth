import React from 'react';

import { ComponentType } from '../types';
import './cw_icon.scss';
import { customIconLookup, iconLookup } from './cw_icon_lookup';
import type { IconComponentProps } from './types';

export const CWIcon = (props: IconComponentProps) => {
  const {
    className,
    componentType = ComponentType.Icon,
    disabled = false,
    iconName,
    iconSize = 'medium',
    onClick,
    selected,
    weight,
    ...otherProps
  } = props;

  // Try to get icon from both lookups
  const Icon =
    iconLookup[iconName as keyof typeof iconLookup] ||
    customIconLookup[iconName as keyof typeof customIconLookup];

  if (!Icon) {
    console.warn(`Icon not found: ${iconName}`);
    return null;
  }

  return (
    <Icon
      className={className}
      componentType={componentType}
      disabled={disabled}
      iconSize={iconSize}
      onClick={onClick}
      selected={selected}
      weight={weight}
      {...otherProps}
    />
  );
};
