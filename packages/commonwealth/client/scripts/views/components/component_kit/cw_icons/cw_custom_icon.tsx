/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_icon.scss';
import m from 'mithril';
import { ComponentType } from '../types';

import { customIconLookup } from './cw_icon_lookup';
import { CustomIconAttrs } from './types';

export class CWCustomIcon extends ClassComponent<CustomIconAttrs> {
  view(vnode: m.Vnode<CustomIconAttrs>) {
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
