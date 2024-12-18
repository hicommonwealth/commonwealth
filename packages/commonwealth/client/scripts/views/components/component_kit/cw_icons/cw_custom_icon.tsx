import React from 'react';

import { ComponentType } from '../types';
import './cw_icon.scss';

import { customIconLookup } from './cw_icon_lookup';
import type { CustomIconProps } from './types';

export const CWCustomIcon = ({
  componentType = ComponentType.CustomIcon,
  iconName,
  iconSize = 'medium',
  ...otherProps
}: CustomIconProps) => {
  // @ts-expect-error <StrictNullChecks/>
  const CustomIcon = customIconLookup[iconName] as React.FC<CustomIconProps>;

  return (
    <CustomIcon
      componentType={componentType}
      iconSize={iconSize}
      {...otherProps}
    />
  );
};
