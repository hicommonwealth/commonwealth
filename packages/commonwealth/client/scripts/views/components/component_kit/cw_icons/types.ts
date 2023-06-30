import type React from 'react';

import type { ComponentType } from '../types';
import type { CustomIconName, IconName } from './cw_icon_lookup';

export type IconButtonTheme = 'black' | 'neutral' | 'primary' | 'hasBackground';

export type IconSize =
  | 'xxs'
  | 'xs'
  | 'small'
  | 'medium'
  | 'large'
  | 'xl'
  | 'xxl';

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
  weight?: 'fill' | 'bold';
} & React.SVGProps<SVGSVGElement>;

export type IconComponentProps = IconProps & {
  iconName: IconName;
  weight?: 'fill' | 'bold';
};

export type CustomIconStyleProps = {
  iconSize?: IconSize;
};

export type CustomIconProps = {
  componentType?: ComponentType;
  iconName?: CustomIconName;
} & CustomIconStyleProps &
  React.SVGProps<SVGSVGElement>;
