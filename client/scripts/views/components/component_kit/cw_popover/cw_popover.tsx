/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import {
  dropXDirectionType,
  dropYDirectionType,
  PopoverPosition,
} from './types';
import {
  buildStyleString,
  checkIfCursorInBounds,
  getPopoverPosition,
} from './helpers';
import { BooleanFlag } from 'aws-sdk/clients/directconnect';
import { isValueNode } from 'graphql';
import { ConsoleLoggerImpl } from 'typescript-logging';
import e from 'express';

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
  arrowId: string;
  isTransitioning: boolean;

  oncreate(vnode) {
    this.isOpen = false;
    this.isRendered = false;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper');
    this.contentId = 'tooltip-container-' + Math.random();
    this.arrowId = this.contentId + '-arrow';
  }

  togglePopOver(onToggle) {
    const newIsOpen = !this.isOpen;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = !this.isRendered;
    m.redraw();
  }

  onClick(onToggle) {
    const newIsOpen = !this.isOpen;
    const newIsRendered = newIsOpen ? true : this.isRendered;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    //   this.isRendered = newIsRendered;

    m.redraw();
  }

  applyPopoverPosition(vnode) {
    // Apply styles in real time
    try {
      const tooltipContainer = document.getElementById(this.contentId);
      const arrow = document.getElementById(this.arrowId);

      const inlineStyle = getPopoverPosition({
        trigger: this.triggerRef,
        container: tooltipContainer,
        arrowSize: 8,
        gapSize: 1,
        toSide: vnode.attrs.toSide,
      });

      tooltipContainer.style.top = `${inlineStyle.contentTopYAmount}px`;
      tooltipContainer.style.left = `${inlineStyle.contentLeftXAmount}px`;

      const showArrow = vnode.attrs.showArrow && inlineStyle.showArrow;

      switch (inlineStyle.popoverPlacement) {
        case 'above': {
          arrow.className = 'arrow-down';
          break;
        }
        case 'below': {
          arrow.className = 'arrow-up';
          break;
        }
        case 'right': {
          arrow.className = 'arrow-left';
          break;
        }
      }
      arrow.style.top = `${inlineStyle.arrowTopYAmount}px`;
      arrow.style.left = `${inlineStyle.arrowLeftXAmount}px`;
      tooltipContainer.style.visibility = 'visible';
      if (showArrow) {
        arrow.style.visibility = 'visible';
      }

      this.isRendered = true;
    } catch (e) {}
    m.redraw();
  }

  handleHoverExit(e, onToggle, vnode) {
    if (!checkIfCursorInBounds(e, this.triggerRef)) {
      if (vnode.attrs.hoverOpenDelay) {
        if (!this.isTransitioning) {
          this.isTransitioning = true;
          setTimeout(() => {
            this.togglePopOver(onToggle);
            this.isTransitioning = false;
          }, vnode.attrs.hoverOpenDelay);
        }
      } else {
        this.togglePopOver(onToggle);
      }
    }
  }

  handleHoverEnter(vnode, onToggle) {
    if (vnode.attrs.hoverOpenDelay) {
      if (!this.isTransitioning) {
        this.isTransitioning = true;
        setTimeout(() => {
          this.onClick(onToggle);
          this.isTransitioning = false;
        }, vnode.attrs.hoverOpenDelay);
      }
    } else {
      this.onClick(onToggle);
    }
  }

  onupdate(vnode) {
    if (this.isOpen && !this.isRendered) {
      try {
        this.applyPopoverPosition(vnode);
      } catch (e) {}
    }
  }

  view(vnode) {
    const { trigger, content, onToggle, toSide, interactionType } = vnode.attrs;
    const { isOpen } = this;

    // Resize Listener
    window.onresize = () => this.applyPopoverPosition(vnode);

    return (
      <>
        {
          <div
            onclick={(e) => {
              if (!interactionType || interactionType == 'click') {
                this.onClick(onToggle);
              }
            }}
            onmouseenter={() => {
              if (interactionType == 'hover') {
                this.handleHoverEnter(vnode, onToggle);
              }
            }}
            class="trigger-wrapper"
            ref="trigger-wrapper"
          >
            {trigger}
          </div>
        }
        {isOpen ? (
          <CWPortal>
            <div
              onclick={() => this.togglePopOver(onToggle)}
              onmousemove={(e) => {
                if (interactionType == 'hover') {
                  this.handleHoverExit(e, onToggle, vnode);
                }
              }}
              class="overlay"
            >
              <div
                class="tooltip-container"
                id={this.contentId}
                ref="tooltip-container"
              >
                {/* {content({
                  style: `width: 20px; height: 20px;`,
                  onclick: () => this.togglePopOver(onToggle),
                  togglePopOver: this.togglePopOver,
                })} */}

                {content}
              </div>
              <div id={this.arrowId}></div>
            </div>
          </CWPortal>
        ) : null}
      </>
    );
  }
}
