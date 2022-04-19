/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { ComponentType } from './types';

type PopoverAttrs = {
  closePopover: () => void;
  content: m.Vnode;
  isOpen: boolean;
};

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  view(vnode) {
    const { content, isOpen, closePopover } = vnode.attrs;
    return isOpen ? (
      <div class={ComponentType.Popover}>
        {content}
        <div onclick={closePopover} class={ComponentType.Overlay}></div>
      </div>
    ) : null;
  }
}
