/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover.scss';

import { CWPortal } from '../cw_portal';
import {
  applyArrowStyles,
  cursorInBounds,
  findRef,
  getPosition,
} from './helpers';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { TooltipType } from '../cw_tooltip';

export type PopoverInteractionType = 'click' | 'hover';

export type SharedPopoverAttrs = {
  hoverOpenDelay?: number;
  interactionType?: PopoverInteractionType;
  persistOnHover?: boolean;
  toSide?: boolean;
  trigger: m.Vnode;
};

type PopoverAttrs = {
  content: m.Children;
  tooltipType?: TooltipType;
  onToggle?: (isOpen: boolean) => void;
  // Gabe 6/1/22 TODO: persistOnHover won't work without a hoverOpenDelay of at least 50
} & SharedPopoverAttrs;

// Gabe 6/1/22 TODO: We probably need a hoverCloseDelay too,
// but maybe hardcoded as opposed to an attr. Via Aden:
// "[tooltip] should only exist for 1.5 seconds on hover
// otherwise disappearing until they hover again"

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
      // TODO Gabe 6/1/22 - Figure out how to avoid these both being null at first
      const popoverContainer = document.getElementById(this.contentId);

      const inlineStyle = getPosition({
        arrowSize: vnode.attrs.tooltipType ? 8 : undefined,
        container: popoverContainer,
        gapSize: vnode.attrs.tooltipType ? 1 : undefined,
        tooltipOffset: vnode.attrs.tooltipType ? 16 : undefined,
        toSide: vnode.attrs.toSide,
        trigger: this.triggerRef,
      });

      popoverContainer.style.top = `${inlineStyle.contentTopYAmount}px`;
      popoverContainer.style.left = `${inlineStyle.contentLeftXAmount}px`;
      popoverContainer.style.visibility = 'visible';

      applyArrowStyles(
        this.arrowId,
        inlineStyle,
        vnode.attrs.singleLine,
        vnode.attrs.tooltipType
      );

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
    const { content, interactionType, onToggle, tooltipType, trigger } =
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
                class={getClasses<{ tooltipType: TooltipType }>(
                  {
                    tooltipType,
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
