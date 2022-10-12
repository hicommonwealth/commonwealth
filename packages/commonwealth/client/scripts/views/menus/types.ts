import { IconName } from '../components/component_kit/cw_icons/cw_icon_lookup';

export type DividerMenuItem = { type: 'divider' };

export type HeaderMenuItem = { type: 'header'; label: string };

export type DefaultMenuItem = {
  disabled?: boolean;
  iconName?: IconName;
  isSecondary?: boolean;
  label: string;
  mobileCaret?: boolean;
  onclick: () => void;
  type?: 'default';
};

export type NotificationMenuItem = {
  label: string;
  mobileCaret?: boolean;
  onclick: () => void;
  iconName?: 'bell';
  unreadNotifications: boolean;
  type: 'notification';
};

export type MenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem
  | NotificationMenuItem;
