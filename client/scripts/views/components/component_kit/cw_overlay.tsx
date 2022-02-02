/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_overlay.scss';

import { ComponentType } from './types';

type OverlayAttrs = {
  isOpen: boolean;
};

export class CWOverlay implements m.ClassComponent<OverlayAttrs> {
  view(vnode) {
    const { isOpen } = vnode.attrs;
    return isOpen && <div class={ComponentType.Overlay}>{vnode.children}</div>;
  }
}
