/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import {
  dropXDirectionType,
  dropYDirectionType,
  PopoverPosition,
} from './types';
import { buildStyleString, getPopoverPosition } from './helpers';
import { BooleanFlag } from 'aws-sdk/clients/directconnect';
import { isValueNode } from 'graphql';
import { ConsoleLoggerImpl } from 'typescript-logging';

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
  toSide?: boolean;
  hasArrow?: boolean;
  onToggle?: (isOpen: boolean) => void;
};

function findRef(dom, ref) {
  return dom.matches(`[ref=${ref}]`) ? dom : dom.querySelector(`[ref=${ref}]`);
}

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  isOpen: boolean;
  isRendered: boolean;
  position: PopoverPosition;
  inlineStyle: any;
  triggerRef: any;
  contentRef: any;
  contentId: string;

  oncreate(vnode) {
    this.isOpen = false;
    this.isRendered = false;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper');
    this.contentId = 'tooltip-container-' + Math.random();
  }

  togglePopOver(onToggle) {
    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = newIsRendered;
  }

  onClick(event, onToggle, toSide, vnode) {
    this.inlineStyle = getPopoverPosition({
      target: event.currentTarget,
      gapSize: 8,
      toSide,
    });

    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = newIsRendered;

    m.redraw();
  }

  calculatePopoverPosition(toSide: boolean) {
    this.inlineStyle = getPopoverPosition({
      target: this.triggerRef,
      gapSize: 8,
      toSide: toSide,
    });
    // Apply styles in real time
    let tooltipContainer;
    try {
      tooltipContainer = document.getElementById(this.contentId);
      console.log();
      if (this.inlineStyle.topYAmount) {
        tooltipContainer.style.top = `${this.inlineStyle.topYAmount}px`;
        tooltipContainer.style.bottom = null;
      }

      if (this.inlineStyle.bottomYAmount) {
        tooltipContainer.style.bottom = `${this.inlineStyle.bottomYAmount}px`;
        tooltipContainer.style.top = null;
      }

      if (this.inlineStyle.leftXAmount) {
        tooltipContainer.style.left = `${this.inlineStyle.leftXAmount}px`;
      }
      tooltipContainer.style.visibility = 'visible';
      console.log('okay cmon', tooltipContainer.getBoundingClientRect());
    } catch (e) {}
    m.redraw();
  }

  onupdate(vnode) {
    if (this.isOpen) {
      try {
        this.calculatePopoverPosition(vnode.attrs.toSide);
      } catch (e) {}
    }
  }

  view(vnode) {
    const { trigger, content, onToggle, toSide } = vnode.attrs;
    const { isOpen } = this;
    window.onresize = () => this.calculatePopoverPosition(toSide);

    return (
      <>
        {
          <div
            onclick={(e) => {
              this.onClick(e, onToggle, toSide, vnode);
            }}
            class="trigger-wrapper"
            ref="trigger-wrapper"
          >
            {trigger}
          </div>
        }
        {isOpen ? (
          <CWPortal>
            <div onclick={() => this.togglePopOver(onToggle)} class="overlay">
              <div
                class="tooltip-container"
                id={this.contentId}
                ref="tooltip-container"
                style="visibility: hidden;"
                //style={buildStyleString(this.inlineStyle)}
              >
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
