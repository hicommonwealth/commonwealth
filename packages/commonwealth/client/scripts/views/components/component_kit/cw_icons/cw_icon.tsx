/* @jsx m */

import ClassComponent from 'class_component';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';

import 'components/component_kit/cw_icon.scss';
import { ComponentType } from '../types';

import { iconLookup } from './cw_icon_lookup';
import type { IconComponentAttrs } from './types';

export class CWIcon extends ClassComponent<IconComponentAttrs> {
  view(vnode: m.Vnode<IconComponentAttrs>) {
    const {
      className,
      componentType = ComponentType.Icon,
      disabled = false,
      iconName,
      iconSize = 'medium',
      onclick,
      selected,
      ...otherAttrs
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
        {...otherAttrs}
      />
    );
  }
}
