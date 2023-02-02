/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_divider.scss';
import m from 'mithril';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type DividerAttrs = {
  isVertical?: boolean;
  className?: string;
};

export class CWDivider extends ClassComponent<DividerAttrs> {
  view(vnode: m.Vnode<DividerAttrs>) {
    const { isVertical, className } = vnode.attrs;

    return (
      <div
        class={getClasses<DividerAttrs>(
          { isVertical, className },
          ComponentType.Divider
        )}
      />
    );
  }
}
