/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button_group.scss';

import { ComponentType } from './types';

export class CWButtonGroup implements m.ClassComponent {
  view(vnode) {
    const { children } = vnode;
    return <div class={ComponentType.ButtonGroup}>{children}</div>;
  }
}
