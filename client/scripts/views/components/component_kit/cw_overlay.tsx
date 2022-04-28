/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_overlay.scss';

type OverlayAttrs = {
  isOpen: boolean;
  onClose: () => void;
  zIndex: number;
};

export class CWOverlay implements m.ClassComponent<OverlayAttrs> {
  isRendered: boolean;

  oncreate(vnode) {
    document.addEventListener('keydown', (e: KeyboardEvent) =>
      this.escFunction(e, vnode)
    );
    this.isRendered = true;
  }

  onremove(vnode) {
    document.removeEventListener('keydown', (e: KeyboardEvent) =>
      this.escFunction(e, vnode)
    );
  }

  escFunction = (event: KeyboardEvent, vnode) => {
    const { isOpen, togglePopOver } = vnode.attrs;

    if (event.key === 'Escape' && isOpen) {
      togglePopOver();
    }

    return null;
  };

  view(vnode) {
    const { children } = vnode;
    const { isOpen, onClick, zIndex } = vnode.attrs;
    const { isRendered } = this;

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        isOpen={isRendered && isOpen}
        // zIndex={zIndex}
      >
        <div isOpen={isRendered && isOpen} onClick={onClick} />
        {children}
      </div>
    );
  }
}
