import { IconName } from '../components/component_kit/cw_icons/cw_icon_lookup';

export type MenuItemAttrs =
  | { type: 'divider' }
  | { type: 'header'; label: string }
  | {
      disabled?: boolean;
      iconName?: IconName;
      isSecondary?: boolean;
      label: string;
      mobileCaret?: boolean;
      onclick: () => void;
      type?: 'action';
    };
