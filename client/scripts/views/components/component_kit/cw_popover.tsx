/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_popover.scss';

import { ComponentType } from './types';

type PopoverAttrs = {
  content: m.Vnode;
  isOpen: boolean;
  closePopover: () => void;
};

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  view(vnode) {
    const { content, isOpen, closePopover } = vnode.attrs;
    return isOpen ? (
      <div class={ComponentType.Popover}>
        <div class="popover-content-container">{content}</div>
        <div onclick={closePopover} class="overlay-background"></div>
      </div>
    ) : null;
  }
}
