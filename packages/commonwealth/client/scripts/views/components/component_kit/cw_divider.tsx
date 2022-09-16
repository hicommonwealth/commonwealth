/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_divider.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

type DividerAttrs = {
  isVertical?: boolean;
};

export class CWDivider implements m.ClassComponent<DividerAttrs> {
  view(vnode) {
    const { isVertical } = vnode.attrs;

    return (
      <div
        class={getClasses<DividerAttrs>({ isVertical }, ComponentType.Divider)}
      />
    );
  }
}
