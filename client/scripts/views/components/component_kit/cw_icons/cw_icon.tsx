/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_icon.scss';

import { IconName, iconLookup } from './cw_icon_lookup';

export type IconSize = 'small' | 'medium' | 'large';

// Gabe 2/28/22 - These styles shouldn't be applied on the icon itself,
// better to wait for an icon button component
// export type IconType = 'primary' | 'secondary';

export type IconStyleAttrs = {
  className?: string;
  disabled?: boolean;
  iconSize?: IconSize;
  // iconType?: IconType;
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
      // iconType = 'primary',
      onclick,
    } = vnode.attrs;

    const Icon = iconLookup[iconName];

    return (
      <Icon
        className={className}
        disabled={disabled}
        iconSize={iconSize}
        // iconType={iconType}
        onclick={onclick}
      />
    );
  }
}
