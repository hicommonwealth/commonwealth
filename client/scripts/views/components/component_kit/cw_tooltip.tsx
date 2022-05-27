/* @jsx m */
/* eslint-disable no-empty */

import m from 'mithril';

import 'components/component_kit/cw_tooltip.scss';

import { CWPortal } from './cw_portal';
import { cursorInBounds, findRef, getPosition } from './cw_popover/helpers';

export type TooltipAttrs = {
  content: m.Children;
  trigger: m.Vnode<any, any>;
  onToggle?: (isOpen: boolean) => void;
  showArrow?: boolean;
  singleLine?: boolean;
  persistOnHover?: boolean;
  hoverOpenDelay?: number;
};

export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  isOpen: boolean;
  isRendered: boolean;
  triggerRef: Element;
  isOverContent: boolean;
  contentId: string;
  arrowId: string;

  oncreate(vnode) {
    this.isOpen = false;
    this.isRendered = true;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper');
    this.contentId = `tooltip-container-${Math.random()}`;
    this.arrowId = `${this.contentId}-arrow`;
  }

  onupdate(vnode) {
    if (this.isOpen && !this.isRendered) {
      try {
        this.applyPopoverPosition(vnode);
      } catch (e) {}
    }
  }

  togglePopOver(onToggle) {
    const newIsOpen = !this.isOpen;
    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = false;

    m.redraw();
  }

  applyPopoverPosition(vnode) {
    // Apply styles in real time
    try {
      const tooltipContainer = document.getElementById(this.contentId);
      const arrow = document.getElementById(this.arrowId);

      const inlineStyle = getPosition({
        trigger: this.triggerRef,
        container: tooltipContainer,
        arrowSize: 6,
        gapSize: 1,
        toSide: vnode.attrs.toSide,
        tooltipOffset: 16,
      });

      tooltipContainer.style.top = `${inlineStyle.contentTopYAmount}px`;
      tooltipContainer.style.left = `${inlineStyle.contentLeftXAmount}px`;

      const showArrow = vnode.attrs.showArrow && inlineStyle.showArrow;

      switch (inlineStyle.popoverPlacement) {
        case 'above': {
          arrow.className = `tooltip-arrow-down${
            !vnode.attrs.singleLine ? ' large' : ''
          }`;
          break;
        }
        case 'below': {
          arrow.className = `tooltip-arrow-up${
            !vnode.attrs.singleLine ? ' large' : ''
          }`;
          break;
        }
        case 'right': {
          arrow.className = `tooltip-arrow-left${
            !vnode.attrs.singleLine ? ' large' : ''
          }`;
          break;
        }
        default: {
          break;
        }
      }

      // TODO: Need to build a positioning engine for the arrow or change the positioning engine for the whole component
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
    if (
      !cursorInBounds(e.offsetX, e.offsetY, this.triggerRef) &&
      (vnode.attrs.persistOnHover ? !this.isOverContent : true)
    ) {
      if (vnode.attrs.hoverOpenDelay) {
        setTimeout(() => {
          if (
            this.isRendered &&
            (vnode.attrs.persistOnHover ? !this.isOverContent : true)
          ) {
            this.togglePopOver(onToggle);
          }
        }, vnode.attrs.hoverOpenDelay);
      } else {
        this.togglePopOver(onToggle);
      }
    }
  }

  handleHoverEnter(onToggle) {
    this.togglePopOver(onToggle);
  }

  view(vnode) {
    const { trigger, content, onToggle, singleLine } = vnode.attrs;
    const { isOpen } = this;

    // Resize Listener
    if (isOpen) {
      window.onresize = () => this.applyPopoverPosition(vnode);
    }

    return (
      <>
        <div
          class="trigger-wrapper"
          ref="trigger-wrapper"
          onmouseenter={() => {
            this.handleHoverEnter(onToggle);
          }}
        >
          {trigger}
        </div>
        {isOpen ? (
          <CWPortal>
            <div
              class="overlay"
              onmousemove={(e) => {
                this.handleHoverExit(e, onToggle, vnode);
              }}
            >
              <div
                class={
                  singleLine
                    ? 'tooltip-container-single'
                    : 'tooltip-container-general'
                }
                ref="tooltip-container"
                id={this.contentId}
                onmouseenter={() => {
                  this.isOverContent = true;
                }}
                onmouseleave={(e) => {
                  this.isOverContent = false;
                }}
              >
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
