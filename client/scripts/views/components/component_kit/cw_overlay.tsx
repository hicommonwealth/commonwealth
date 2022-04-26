/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_overlay.scss';

import { CWPortal, PortalAttrs } from './cw_portal';
import { ComponentType } from './types';

type OverlayableAttrs = {
  inline?: boolean;
  portalAttrs?: PortalAttrs;
};

type OverlayAttrs = {
  content?: m.Children;
  isOpen?: boolean;
} & OverlayableAttrs;

export class CWOverlay implements m.ClassComponent<OverlayAttrs> {
  private shouldRender: boolean;

  onremove() {
    if (this.shouldRender === true) {
      this.handleClose();
      this.shouldRender = false;
    }
  }

  view(vnode) {
    console.log('in overlay view isOpen', vnode.attrs.isOpen);
    const { inline, portalAttrs } = vnode.attrs;

    // if (!this.shouldRender) {
    //   // console.log('in overlay check');
    //   return null;
    // }

    // const innerContent = [
    //     hasBackdrop && m('', {
    //       class: classnames(Classes.OVERLAY_BACKDROP, backdropClass),
    //       onmousedown: this.handleBackdropMouseDown,
    //       tabindex: 0
    //     }),
    //     content
    //   ];

    //   const classes = classnames(
    //     Classes.OVERLAY,
    //     inline && Classes.OVERLAY_INLINE,
    //     className
    //   );

    //   const container = m('', {
    //     class: classes,
    //     style,
    //     oncreate: this.onContainerCreate,
    //     onupdate: this.onContainerUpdate
    //   }, innerContent);

    const container = (
      <div class={ComponentType.Overlay}>{vnode.attrs.content}</div>
    );

    return vnode.attrs.isOpen ? (
      <CWPortal {...portalAttrs}>{container}</CWPortal>
    ) : null;
  }

  onContainerCreate = ({ dom }: m.VnodeDOM) => {
    if (this.shouldRender) {
      this.handleOpen(dom as HTMLElement);
    }
  };

  handleOpen(contentEl: HTMLElement) {
    // const { inline } = this.attrs;
    // this.contentEl = contentEl;
    // if (addToStack) {
    //   Overlay.openStack.push(this.id);
    // }
    // if (closeOnOutsideClick && !hasBackdrop) {
    //   document.addEventListener('mousedown', this.handleDocumentMouseDown);
    // }
    // if (closeOnEscapeKey) {
    //   document.addEventListener('keydown', this.handleKeyDown);
    // }
    // this.handleEnterTransition();
    // if (hasBackdrop && !inline) {
    //   document.body.classList.add(Classes.OVERLAY_OPEN);
    //   const bodyHasScrollbar = hasScrollbar(document.body);
    //   if (bodyHasScrollbar) {
    //     document.body.style.paddingRight = `${getScrollbarWidth()}px`;
    //   }
    // }
    // safeCall(onOpened, contentEl);
    // this.handleFocus();
  }

  private handleClose() {
    // document.removeEventListener('mousedown', this.handleDocumentMouseDown);
    // document.removeEventListener('keydown', this.handleKeyDown);
    // this.handleExitTransition();
  }

  private handleClosed() {
    // const { restoreFocus, onClosed, hasBackdrop, inline } = this.attrs;
    // if (this.attrs.addToStack) {
    //   Overlay.openStack = Overlay.openStack.filter((id) => id !== this.id);
    // }
    // if (this.lastActiveElement && restoreFocus) {
    //   window.requestAnimationFrame(() => this.lastActiveElement.focus());
    // }
    // if (hasBackdrop && !inline) {
    //   document.body.classList.remove(Classes.OVERLAY_OPEN);
    //   document.body.style.paddingRight = '';
    // }
    // safeCall(onClosed);
  }
}
