/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';

import { IconName, iconLookup } from './cw_icon_lookup';

export type IconSize = 'small' | 'medium' | 'large';

export type IconStyleAttrs = {
  className?: string;
  disabled?: boolean;
  iconSize?: IconSize;
};

export type IconAttrs = IconStyleAttrs & {
  iconName: IconName;
  onclick?: () => void;
};

export class CWIcon implements m.ClassComponent<IconAttrs> {
  view(vnode) {
    const {
      className,
      disabled = false,
      iconName,
      iconSize = 'medium',
      onclick,
    } = vnode.attrs;

    const Icon = iconLookup[iconName];

    return (
      <Icon
        className={className}
        disabled={disabled}
        iconSize={iconSize}
        onclick={onclick}
      />
    );
  }
}
