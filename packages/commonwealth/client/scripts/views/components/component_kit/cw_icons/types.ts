import React from 'react';
import { ComponentType } from '../types';
import { CustomIconName, IconName } from './cw_icon_lookup';

export type IconButtonTheme = 'black' | 'neutral' | 'primary' | 'hasBackground';

export type IconSize = 'small' | 'medium' | 'large' | 'xl' | 'xxl';

export type IconStyleProps = {
  className?: string;
  disabled?: boolean;
  iconButtonTheme?: IconButtonTheme;
  iconSize?: IconSize;
  selected?: boolean;
};

export type IconProps = IconStyleProps & {
  componentType?: ComponentType;
  onClick?: (e?: React.MouseEvent<HTMLElement | SVGSVGElement>) => void;
} & React.SVGProps<SVGSVGElement>;

export type IconComponentProps = IconProps & { iconName: IconName };

export type CustomIconStyleProps = {
  iconSize?: IconSize;
};

export type CustomIconProps = {
  componentType?: ComponentType;
  iconName?: CustomIconName;
} & CustomIconStyleProps &
  React.SVGProps<SVGSVGElement>;
