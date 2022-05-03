import { ComponentType } from '../types';
import { IconName } from './cw_icon_lookup';

type IconButtonTheme = 'neutral' | 'primary';

export type IconSize = 'small' | 'medium' | 'large';

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
