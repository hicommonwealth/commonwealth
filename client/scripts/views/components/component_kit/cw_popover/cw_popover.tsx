/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_tooltip.scss';

import { CWPortal } from '../cw_portal';
import {
  dropXDirectionType,
  dropYDirectionType,
  PopoverPosition,
} from './types';
import { getPopoverPosition } from './helpers';
import { concatMap } from 'rxjs';
import { MaxKeys } from 'aws-sdk/clients/s3';

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
  alwaysRender?: boolean;
  gap?: number;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  popover: (attrs: PopoverChildAttrs) => any;
  toggle: (attrs: PopoverToggleAttrs) => any;
  toSide?: boolean;
  xDirection?: dropXDirectionType;
  yDirection?: dropYDirectionType;
  toggleTest: m.Component;
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
    const {
      gap,
      onToggle,
      popover,
      toggle,
      toSide,
      xDirection,
      yDirection,
      toggleTest,
    } = vnode.attrs;
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
        {
          <div
            onclick={(e) => {
              this.onClick(e, gap, toSide, onToggle, xDirection, yDirection);
            }}
            style="display: flex; width: fit-content;"
          >
            {toggleTest}
          </div>
        }
        {isOpen ? (
          <CWPortal>
            <div
              onclick={() => this.togglePopOver(onToggle)}
              style="position: fixed; width: 100%; height: 100%; left: 0; top: 0;"
            >
              <div class="tooltip-container" style="width: 100px;">
                {popover({
                  style: `width: ${position.maxWidth}; height: ${position.maxHeight};`,
                  onclick: () => this.togglePopOver(onToggle),
                  togglePopOver: this.togglePopOver,
                })}
              </div>
            </div>
          </CWPortal>
        ) : null}
      </>
    );
  }
}
