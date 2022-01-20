import { CWArrowDown } from './cw_arrow_down_icon';
import { CWArrowRight } from './cw_arrow_right_icon';

export const icons = {
  'arrow-down': CWArrowDown,
  'arrow-right': CWArrowRight,
};

export type IconName = keyof typeof icons;
