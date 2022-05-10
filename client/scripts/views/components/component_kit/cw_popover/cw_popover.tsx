/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import {
  dropXDirectionType,
  dropYDirectionType,
  PopoverPosition,
} from './types';
import { getPopoverPosition } from './helpers';
import { concatMap } from 'rxjs';

export type PopoverToggleAttrs = {
  isActive: boolean;
  onClick: (event: Event) => void;
};

export type PopoverChildAttrs = {
  position: PopoverPosition;
  onClick: (event: Event) => void;
  togglePopOver: () => void;
};

export type PopoverAttrs = {
  content: m.Component;
  trigger: m.Component;
  alwaysRender?: boolean;
  gap?: number;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  popover: (attrs: PopoverChildAttrs) => any;
  toggle: (attrs: PopoverToggleAttrs) => any;
  toSide?: boolean;
  xDirection?: dropXDirectionType;
  yDirection?: dropYDirectionType;
};

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  isOpen: boolean;
  isRendered: boolean;
  position: PopoverPosition;

  oncreate() {
    this.isOpen = false;
    this.isRendered = false;
  }

  togglePopOver(onToggle) {
    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    console.log('toggly');
    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = newIsRendered;
  }

  onClick(event, gap, toSide, onToggle, xDirection, yDirection) {
    console.log('clicky');
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
    console.log('attrs', vnode.attrs);
    console.log('position', position);

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
              style: 'position: fixed; top: 0; left: 0',
              onclick: () => this.togglePopOver(onToggle),
              togglePopOver: this.togglePopOver,
            })}
          </CWPortal>
        ) : null}
      </>
    );
  }
}
