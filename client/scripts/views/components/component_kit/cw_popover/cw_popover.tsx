/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import {
  dropXDirectionType,
  dropYDirectionType,
  PopoverPosition,
} from './types';
import { getPopoverPosition, getPopoverPosition2 } from './helpers';
import { BooleanFlag } from 'aws-sdk/clients/directconnect';

export type PopoverToggleAttrs = {
  isActive: boolean;
  onClick: (event: Event) => void;
};

export type PopoverChildAttrs = {
  position: PopoverPosition;
  onClick: (event: Event) => void;
  togglePopOver: () => void;
};

export type PopoverAttrs2 = {
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

export type PopoverAttrs = {
  content: m.Children;
  trigger: m.Vnode<any, any>;
  closeOnContentClick?: boolean;
  closeOnEscapeClick: boolean;
  interactionType?: 'hover' | 'click';
  hoverOpenDelay?: number;
  onToggle?: (isOpen: boolean) => void;
};

function findRef(dom, ref) {
  return dom.matches(`[ref=${ref}]`) ? dom : dom.querySelector(`[ref=${ref}]`);
}

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  isOpen: boolean;
  isRendered: boolean;
  position: PopoverPosition;
  inlineStyle: string;
  triggerRef: any;

  oncreate(vnode) {
    this.isOpen = false;
    this.isRendered = false;
    this.triggerRef = findRef(vnode.dom, 'title');
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

    this.inlineStyle = getPopoverPosition2({
      target: event.currentTarget,
      gapSize: 8,
      toSide: false,
    });

    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = newIsRendered;
    this.position = position;
  }

  calculatePopoverPosition() {
    this.inlineStyle = getPopoverPosition2({
      target: this.triggerRef,
      gapSize: 8,
      toSide: false,
    });
    m.redraw();
  }

  view(vnode) {
    const { trigger, content, onToggle } = vnode.attrs;
    const { isOpen, position } = this;

    window.onresize = () => this.calculatePopoverPosition();
    console.log('style: ', this.inlineStyle);
    return (
      <>
        {
          <div
            onclick={(e) => {
              this.onClick(e, null, false, onToggle, null, null);
            }}
            class="trigger-wrapper"
            ref="title"
          >
            {trigger}
          </div>
        }
        {isOpen ? (
          <CWPortal>
            <div onclick={() => this.togglePopOver(onToggle)} class="overlay">
              <div class="tooltip-container" style={this.inlineStyle}>
                {/* {content({
                  style: `width: 20px; height: 20px;`,
                  onclick: () => this.togglePopOver(onToggle),
                  togglePopOver: this.togglePopOver,
                })} */}

                {content}
              </div>
            </div>
          </CWPortal>
        ) : null}
      </>
    );
  }
}
