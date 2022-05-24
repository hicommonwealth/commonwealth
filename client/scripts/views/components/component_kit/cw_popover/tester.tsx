/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import { PopoverPosition } from './types';
import { checkIfCursorInBounds, findRef, getPopoverPosition } from './helpers';

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
  triggerRef: any;
  contentId: string;
  arrowId: string;
  isTransitioning: boolean;
  isOverContent: boolean;

  oncreate(vnode) {
    this.isOpen = false;
    this.isRendered = false;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper');
    this.contentId = 'tooltip-container-' + Math.random();
    this.arrowId = this.contentId + '-arrow';
  }

  onupdate(vnode) {
    if (this.isOpen && !this.isRendered && !this.isTransitioning) {
      try {
        this.applyPopoverPosition(vnode);
      } catch (e) {}
    }
  }

  onClick(onToggle) {
    const newIsOpen = !this.isOpen;
    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    m.redraw();
  }

  togglePopOver(onToggle) {
    const newIsOpen = !this.isOpen;

    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = !this.isRendered;
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
      this.isTransitioning = false;
    } catch (e) {}
    m.redraw();
  }

  handleHoverExit(e, onToggle, vnode) {
    if (!checkIfCursorInBounds(e.offsetX, e.offsetY, this.triggerRef)) {
      if (vnode.attrs.hoverOpenDelay) {
        if (!this.isTransitioning) {
          this.isTransitioning = true;
          setTimeout(() => {
            // Check if curser inside content
            if (!this.isOverContent) {
              this.togglePopOver(onToggle);
              this.isTransitioning = false;
            }
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

  view(vnode) {
    const { trigger, content, onToggle, interactionType } = vnode.attrs;
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
                console.log('boerin');
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
                onmouseenter={() => {
                  this.isOverContent = true;
                }}
                onmouseleave={(e) => {
                  this.isOverContent = false;
                  if (interactionType == 'hover') {
                    this.togglePopOver(onToggle);
                    this.isTransitioning = false;
                  }
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
