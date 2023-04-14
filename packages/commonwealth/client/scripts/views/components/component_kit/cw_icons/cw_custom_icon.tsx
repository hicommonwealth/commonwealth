import 'components/component_kit/cw_icon.scss';
import React from 'react';
import { ComponentType } from '../types';

import { customIconLookup } from './cw_icon_lookup';
import type { CustomIconProps } from './types';

export const CWCustomIcon = (props: CustomIconProps) => {
  const {
    componentType = ComponentType.CustomIcon,
    iconName,
    iconSize = 'medium',
    ...otherProps
  } = props;

  const CustomIcon = customIconLookup[iconName];

  return (
    <CustomIcon
      componentType={componentType}
      iconSize={iconSize}
      {...otherProps}
    />
  );
};
