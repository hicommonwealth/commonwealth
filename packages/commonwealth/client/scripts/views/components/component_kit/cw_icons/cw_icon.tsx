/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';

import { iconLookup } from './cw_icon_lookup';
import { IconAttrs } from './types';
import { ComponentType } from '../types';

export class CWIcon implements m.ClassComponent<IconAttrs> {
  view(vnode) {
    const {
      className,
      componentType = ComponentType.Icon,
      disabled = false,
      iconName,
      iconSize = 'medium',
      onclick,
      selected,
      ...domAttrs
    } = vnode.attrs;

    const Icon = iconLookup[iconName];

    return (
      <Icon
        className={className}
        componentType={componentType}
        disabled={disabled}
        iconSize={iconSize}
        onclick={onclick}
        selected={selected}
        {...domAttrs}
      />
    );
  }
}
