/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

// import { ComponentType } from './types';
import { CWOverlay } from './cw_overlay';

type PopoverAttrs = {
  closePopover: () => void;
  content: m.Vnode;
  isOpen: boolean;
};

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  view(vnode) {
    const { content, isOpen, closePopover } = vnode.attrs;

    return (
      <CWOverlay isOpen={isOpen} content={content} onClose={closePopover} />
    );
  }
}
