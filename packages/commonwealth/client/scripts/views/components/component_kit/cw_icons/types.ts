import { ComponentType } from '../types';
import { CustomIconName, IconName } from './cw_icon_lookup';

export type IconButtonTheme = 'black' | 'neutral' | 'primary' | 'hasBackground';

export type IconSize = 'small' | 'medium' | 'large' | 'xl' | 'xxl';

export type IconStyleAttrs = {
  className?: string;
  disabled?: boolean;
  iconButtonTheme?: IconButtonTheme;
  iconSize?: IconSize;
  selected?: boolean;
};

export type IconAttrs = IconStyleAttrs & {
  componentType?: ComponentType;
  onclick?: (e?: MouseEvent) => void; // should be used by icon button, not by plain icons
};

export type IconComponentAttrs = IconAttrs & { iconName: IconName };

export type CustomIconStyleAttrs = {
  iconSize?: IconSize;
};

export type CustomIconAttrs = {
  componentType?: ComponentType;
  iconName?: CustomIconName;
} & CustomIconStyleAttrs;
