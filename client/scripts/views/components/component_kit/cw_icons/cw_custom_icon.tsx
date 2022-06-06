/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';

import { customIconLookup } from './cw_icon_lookup';
import { CustomIconAttrs } from './types';
import { ComponentType } from '../types';

export class CWCustomIcon implements m.ClassComponent<CustomIconAttrs> {
  view(vnode) {
    const {
      componentType = ComponentType.CustomIcon,
      iconName,
      iconSize = 'medium',
    } = vnode.attrs;

    const CustomIcon = customIconLookup[iconName];

    return <CustomIcon componentType={componentType} iconSize={iconSize} />;
  }
}
