/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';

import 'components/component_kit/cw_icon.scss';

import { customIconLookup } from './cw_icon_lookup';
import { CustomIconAttrs } from './types';
import { ComponentType } from '../types';

export class CWCustomIcon extends ClassComponent<CustomIconAttrs> {
  view(vnode: ResultNode<CustomIconAttrs>) {
    const {
      componentType = ComponentType.CustomIcon,
      iconName,
      iconSize = 'medium',
      ...otherAttrs
    } = vnode.attrs;

    const CustomIcon = customIconLookup[iconName];

    return (
      <CustomIcon
        componentType={componentType}
        iconSize={iconSize}
        {...otherAttrs}
      />
    );
  }
}
