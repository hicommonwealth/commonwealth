/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_overlay.scss';

import { CWPortal } from './cw_portal';
import { ComponentType } from './types';

type OverlayAttrs = {
  content?: m.Children;
  inline?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

export class CWOverlay implements m.ClassComponent<OverlayAttrs> {
  private shouldRender: boolean;

  onremove() {
    if (this.shouldRender === true) {
      this.shouldRender = false;
    }
  }

  view(vnode) {
    const { content, isOpen, onClose } = vnode.attrs;

    document.addEventListener('mousedown', onClose);

    console.log(isOpen);

    const container = <div class={ComponentType.Overlay}>{content}</div>;

    return isOpen ? <CWPortal>{container}</CWPortal> : null;
  }
}
