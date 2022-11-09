/* @jsx m */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';
import ClassComponent from 'helpers/class_component';

import 'components/component_kit/cw_icon.scss';

import { iconLookup } from './cw_icon_lookup';
import { IconComponentAttrs } from './types';
import { ComponentType } from '../types';

export class CWIcon extends ClassComponent<IconComponentAttrs> {
  view(vnode: m.Vnode<IconComponentAttrs, this>) {
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

    const Icon = iconLookup['arrowLeft'];

    return Icon({
      className,
      componentType,
      disabled,
      iconSize,
      onclick,
      selected,
      ...domAttrs,
    });

    // return m(Icon, {
    //   className,
    //   componentType,
    //   disabled,
    //   iconSize,
    //   onclick,
    //   selected,
    //   ...domAttrs,
    // });

    // return (
    //   <Icon
    //     className={className}
    //     componentType={componentType}
    //     disabled={disabled}
    //     iconSize={iconSize}
    //     onclick={onclick}
    //     selected={selected}
    //     {...domAttrs}
    //   />
    // );
  }
}
