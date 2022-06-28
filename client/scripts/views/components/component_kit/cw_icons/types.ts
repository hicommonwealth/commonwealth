import { ComponentType } from '../types';
import { IconName } from './cw_icon_lookup';

export type IconButtonTheme = 'neutral' | 'primary' | 'mobile';

export type IconSize = 'small' | 'medium' | 'large' | 'xl' | 'xxl';

export type IconStyleAttrs = {
  className?: string;
  disabled?: boolean;
  iconButtonTheme: IconButtonTheme;
  iconSize?: IconSize;
  selected?: boolean;
};

export type IconAttrs = IconStyleAttrs & {
  componentType: ComponentType;
  iconName: IconName;
  onclick?: () => void; // should be used by icon button, not by plain icons
};

export type CustomIconStyleAttrs = {
  iconSize?: IconSize;
};

export type CustomIconAttrs = {
  componentType: ComponentType;
  iconName: IconName;
} & CustomIconStyleAttrs;
