/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode } from 'mithrilInterop';

import 'components/component_kit/cw_icon.scss';

import { iconLookup } from './cw_icon_lookup';
import { IconComponentAttrs } from './types';
import { ComponentType } from '../types';

export class CWIcon extends ClassComponent<IconComponentAttrs> {
  view(vnode: ResultNode<IconComponentAttrs>) {
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
