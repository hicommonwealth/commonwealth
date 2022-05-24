/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import { cursorInBounds, findRef, getPopoverPosition } from './helpers';

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

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  isOpen: boolean;
  isRendered: boolean;
  isOverContent: boolean;
  triggerRef: any;
  contentId: string;
  arrowId: string;

  oncreate(vnode) {
    this.isOpen = false;
    this.isRendered = true;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper');
    this.contentId = 'tooltip-container-' + Math.random();
    this.arrowId = this.contentId + '-arrow';
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
    if (
      !cursorInBounds(e.offsetX, e.offsetY, this.triggerRef) &&
      !this.isOverContent
    ) {
      if (vnode.attrs.hoverOpenDelay) {
        setTimeout(() => {
          if (!this.isOverContent && this.isRendered) {
            this.togglePopOver(onToggle);
          }
        }, vnode.attrs.hoverOpenDelay);
      } else {
        this.togglePopOver(onToggle);
      }
    }
  }

  handleHoverEnter(vnode, onToggle) {
    if (vnode.attrs.hoverOpenDelay) {
      setTimeout(() => {
        this.togglePopOver(onToggle);
      }, vnode.attrs.hoverOpenDelay);
    } else {
      this.togglePopOver(onToggle);
    }
  }

  view(vnode) {
    const { trigger, content, onToggle, interactionType } = vnode.attrs;
    const { isOpen } = this;

    // Resize Listener
    if (isOpen) {
      window.onresize = () => this.applyPopoverPosition(vnode);
    }

    return (
      <>
        {
          <div
            class="trigger-wrapper"
            ref="trigger-wrapper"
            onclick={(e) => {
              if (!interactionType || interactionType == 'click') {
                this.togglePopOver(onToggle);
              }
            }}
            onmouseenter={() => {
              if (interactionType == 'hover') {
                this.handleHoverEnter(vnode, onToggle);
              }
            }}
          >
            {trigger}
          </div>
        }
        {isOpen ? (
          <CWPortal>
            <div
              class="overlay"
              onclick={() => {
                if (!interactionType || interactionType == 'click') {
                  this.togglePopOver(onToggle);
                }
              }}
              onmousemove={(e) => {
                if (interactionType == 'hover') {
                  this.handleHoverExit(e, onToggle, vnode);
                }
              }}
            >
              <div
                class="tooltip-container"
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
