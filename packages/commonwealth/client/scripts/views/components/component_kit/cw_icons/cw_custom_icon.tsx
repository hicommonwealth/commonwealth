/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_icon.scss';

import { customIconLookup } from './cw_icon_lookup';
import { CustomIconProps } from './types';
import { ComponentType } from '../types';

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
