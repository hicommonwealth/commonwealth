/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_icon.scss';

import { IconName, icons } from './cw_icons/cw_icon_lookup';

export enum IconSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum IconType {
  Primary = 'primary',
  Secondary = 'secondary',
}

export type IconStyleAttrs = {
  iconSize: IconSize;
  iconType: IconType;
  disabled?: boolean;
};

export type IconAttrs = IconStyleAttrs & { iconName: IconName };

export const CWIcon: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { iconName, iconSize, iconType, disabled } = vnode.attrs;
    const Icon = icons[iconName];
    return m(Icon, { iconSize, iconType, disabled });
  },
};
