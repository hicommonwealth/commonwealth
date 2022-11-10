/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_icon.scss';

import { customIconLookup } from './cw_icon_lookup';
import { CustomIconAttrs } from './types';
import { ComponentType } from '../types';

export class CWCustomIcon extends ClassComponent<CustomIconAttrs> {
  view(vnode: m.Vnode<CustomIconAttrs>) {
    const {
      componentType = ComponentType.CustomIcon,
      iconName,
      iconSize = 'medium',
      ...domAttrs
    } = vnode.attrs;

    const CustomIcon = customIconLookup[iconName];

    return (
      <CustomIcon
        componentType={componentType}
        iconSize={iconSize}
        {...domAttrs}
      />
    );
  }
}
