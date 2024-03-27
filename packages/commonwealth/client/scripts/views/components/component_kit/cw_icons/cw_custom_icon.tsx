import React from 'react';

import 'components/component_kit/cw_icon.scss';
import { ComponentType } from '../types';

import { customIconLookup } from './cw_icon_lookup';
import type { CustomIconProps } from './types';

export const CWCustomIcon = ({
  componentType = ComponentType.CustomIcon,
  iconName,
  iconSize = 'medium',
  ...otherProps
}: CustomIconProps) => {
  const CustomIcon = customIconLookup[iconName] as React.FC<CustomIconProps>;

  return (
    <CustomIcon
      componentType={componentType}
      iconSize={iconSize}
      {...otherProps}
    />
  );
};
