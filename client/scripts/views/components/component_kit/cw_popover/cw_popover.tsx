/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import { cursorInBounds, findRef, getPosition } from './helpers';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';

export type PopoverInteractionType = 'click' | 'hover';

type PopoverStyleAttrs = { singleLine?: boolean };

export type PopoverAttrs = {
  content: m.Children;
  hasArrow?: boolean;
  hoverOpenDelay?: number;
  interactionType?: PopoverInteractionType;
  onToggle?: (isOpen: boolean) => void;
  persistOnHover?: boolean;
  toSide?: boolean;
  trigger: m.Vnode;
} & PopoverStyleAttrs;

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  private arrowId: string;
  private contentId: string;
  private isOpen: boolean;
  private isOverContent: boolean;
  private isRendered: boolean;
  private triggerRef: Element;

  oncreate(vnode) {
    this.contentId = `popover-container-ref-${Math.random()}`; // has to be set first
    this.arrowId = `${this.contentId}-arrow`;
    this.isOpen = false;
    this.isRendered = true;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper-ref');
  }

  onupdate(vnode) {
    if (this.isOpen && !this.isRendered) {
      try {
        this.applyPopoverPosition(vnode);
      } catch (e) {
        console.log(e);
      }
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
      const popoverContainer = document.getElementById(this.contentId);
      const arrow = document.getElementById(this.arrowId);

      const inlineStyle = getPosition({
        trigger: this.triggerRef,
        container: popoverContainer,
        arrowSize: 8,
        gapSize: 1,
        toSide: vnode.attrs.toSide,
      });

      popoverContainer.style.top = `${inlineStyle.contentTopYAmount}px`;
      popoverContainer.style.left = `${inlineStyle.contentLeftXAmount}px`;

      const showArrow = vnode.attrs.hasArrow && inlineStyle.showArrow;

      switch (inlineStyle.popoverPlacement) {
        case 'above': {
          arrow.className = `arrow-down${
            vnode.attrs.singleLine ? ' singleLine' : ''
          }`;
          break;
        }
        case 'below': {
          arrow.className = `arrow-up${
            vnode.attrs.singleLine ? ' singleLine' : ''
          }`;
          break;
        }
        case 'right': {
          arrow.className = `arrow-left${
            vnode.attrs.singleLine ? ' singleLine' : ''
          }`;
          break;
        }
        default: {
          break;
        }
      }

      arrow.style.top = `${inlineStyle.arrowTopYAmount}px`;
      arrow.style.left = `${inlineStyle.arrowLeftXAmount}px`;
      popoverContainer.style.visibility = 'visible';

      if (showArrow) {
        arrow.style.visibility = 'visible';
      }

      this.isRendered = true;
    } catch (e) {
      console.log(e);
    }
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
    const { trigger, content, onToggle, interactionType, singleLine } =
      vnode.attrs;
    const { isOpen } = this;

    // Resize Listener
    if (isOpen) {
      window.onresize = () => this.applyPopoverPosition(vnode);
    }

    return (
      <>
        <div
          class="trigger-wrapper"
          ref="trigger-wrapper-ref"
          onclick={() => {
            if (!interactionType || interactionType === 'click') {
              this.togglePopOver(onToggle);
            }
          }}
          onmouseenter={() => {
            if (interactionType === 'hover') {
              this.handleHoverEnter(vnode, onToggle);
            }
          }}
        >
          {trigger}
        </div>
        {isOpen ? (
          <CWPortal>
            <div
              class="overlay"
              onclick={() => {
                if (!interactionType || interactionType === 'click') {
                  this.togglePopOver(onToggle);
                }
              }}
              onmousemove={(e) => {
                if (interactionType === 'hover') {
                  this.handleHoverExit(e, onToggle, vnode);
                }
              }}
            >
              <div
                class={getClasses<PopoverStyleAttrs>(
                  {
                    singleLine,
                  },
                  ComponentType.Popover
                )}
                ref="popover-container-ref"
                id={this.contentId}
                onmouseenter={() => {
                  this.isOverContent = true;
                }}
                onmouseleave={() => {
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
