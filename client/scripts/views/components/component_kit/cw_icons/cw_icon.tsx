/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_icon.scss';

import { IconName, iconLookup } from './cw_icon_lookup';

export type IconSize = 'small' | 'medium' | 'large';

export type IconType = 'primary' | 'secondary';

export type IconStyleAttrs = {
  iconSize?: IconSize;
  iconType?: IconType;
  disabled?: boolean;
};

export type IconAttrs = IconStyleAttrs & { iconName: IconName };

export class CWIcon implements m.ClassComponent<IconAttrs> {
  view(vnode) {
    const {
      disabled = false,
      iconName,
      iconSize = 'medium',
      iconType = 'primary',
    } = vnode.attrs;

    const Icon = iconLookup[iconName];

    return <Icon iconSize={iconSize} iconType={iconType} disabled={disabled} />;
  }
}
