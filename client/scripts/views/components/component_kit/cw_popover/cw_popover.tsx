/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import { PopoverAttrs, PopoverPosition } from './types';
import { getPopoverPosition } from './helpers';

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  isOpen: boolean;
  isRendered: boolean;
  position: PopoverPosition;

  constructor() {
    this.isOpen = false;
    this.isRendered = false;
  }

  togglePopOver(onToggle) {
    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = newIsRendered;
  }

  onClick(event, gap, toSide, onToggle, xDirection, yDirection) {
    const position = getPopoverPosition({
      gap,
      target: event.currentTarget,
      toSide,
      xDirection,
      yDirection,
    });

    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = newIsRendered;
    this.position = position;
  }

  view(vnode) {
    const { gap, onToggle, popover, toggle, toSide, xDirection, yDirection } =
      vnode.attrs;
    const { isOpen, position } = this;

    return (
      <>
        {toggle({
          onClick: (e) => {
            this.onClick(e, gap, toSide, onToggle, xDirection, yDirection);
          },
          isActive: isOpen,
        })}
        {isOpen ? (
          <CWPortal>
            {popover({
              position,
              onClick: this.togglePopOver(onToggle),
              togglePopOver: this.togglePopOver,
            })}
          </CWPortal>
        ) : null}
      </>
    );
  }
}
