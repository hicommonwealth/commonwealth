/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_popover/cw_popover.scss';
import m from 'mithril';

import { CWPortal } from '../cw_portal';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import type { TooltipType } from './cw_tooltip';
import {
  applyArrowStyles,
  cursorInBounds,
  findRef,
  getPosition,
} from './helpers';

export type PopoverInteractionType = 'click' | 'hover';

export type SharedPopoverAttrs = {
  hoverCloseDelay?: number;
  hoverOpenDelay?: number;
  interactionType?: PopoverInteractionType;
  persistOnHover?: boolean;
  tooltipType?: TooltipType;
  toSide?: boolean;
  trigger: m.Vnode;
};

type PopoverAttrs = {
  content: m.Children;
  onToggle?: (isOpen: boolean) => void;
} & SharedPopoverAttrs;

const defaultHoverCloseDelay = 100;

export class CWPopover extends ClassComponent<PopoverAttrs> {
  private arrowId: string;
  private contentId: string;
  private isOpen: boolean;
  private isOverContent: boolean;
  private isRendered: boolean;
  private triggerRef: Element;

  oncreate(vnode: m.VnodeDOM<PopoverAttrs>) {
    this.contentId = `popover-container-ref-${Math.random()}`; // has to be set first
    this.arrowId = `${this.contentId}-arrow`;
    this.isOpen = false;
    this.isRendered = true;
    this.triggerRef = findRef(vnode.dom, 'trigger-wrapper-ref');
  }

  onupdate(vnode: m.Vnode<PopoverAttrs>) {
    if (this.isOpen && !this.isRendered) {
      try {
        this.applyPopoverPosition(vnode);
      } catch (e) {
        console.log(e);
      }
    }
  }

  togglePopOver(onToggle: (isOpen: boolean) => void) {
    const newIsOpen = !this.isOpen;
    onToggle && onToggle(newIsOpen);

    this.isOpen = newIsOpen;
    this.isRendered = false;

    m.redraw();
  }

  applyPopoverPosition(vnode: m.Vnode<PopoverAttrs>) {
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

      if (vnode.attrs.tooltipType) {
        applyArrowStyles(this.arrowId, inlineStyle, vnode.attrs.tooltipType);
      }

      this.isRendered = true;
    } catch (e) {
      console.log(e);
    }
    m.redraw();
  }

  handleHoverExit(
    e: MouseEvent,
    onToggle: (isOpen: boolean) => void,
    vnode: m.Vnode<PopoverAttrs>
  ) {
    const { persistOnHover } = vnode.attrs;

    const hoverCloseDelay = vnode.attrs.hoverCloseDelay
      ? vnode.attrs.hoverCloseDelay
      : defaultHoverCloseDelay;

    if (
      !cursorInBounds(e.offsetX, e.offsetY, this.triggerRef) &&
      (persistOnHover ? !this.isOverContent : true)
    ) {
      if (hoverCloseDelay) {
        setTimeout(() => {
          if (
            this.isRendered &&
            (persistOnHover ? !this.isOverContent : true)
          ) {
            this.togglePopOver(onToggle);
          }
        }, hoverCloseDelay);
      } else {
        this.togglePopOver(onToggle);
      }
    }
  }

  handleHoverEnter(
    hoverOpenDelay: number,
    onToggle: (isOpen: boolean) => void
  ) {
    if (hoverOpenDelay) {
      setTimeout(() => {
        this.togglePopOver(onToggle);
      }, hoverOpenDelay);
    } else {
      this.togglePopOver(onToggle);
    }
  }

  view(vnode: m.Vnode<PopoverAttrs>) {
    const {
      content,
      hoverOpenDelay,
      interactionType,
      onToggle,
      tooltipType,
      trigger,
    } = vnode.attrs;

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
              this.handleHoverEnter(hoverOpenDelay, onToggle);
            }
          }}
        >
          {trigger}
        </div>
        {isOpen ? (
          <CWPortal>
            <div
              class="popover-overlay"
              onclick={() => {
                if (!interactionType || interactionType === 'click') {
                  this.togglePopOver(onToggle);
                }
              }}
              onmousemove={(e: MouseEvent) => {
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
              {tooltipType && <div id={this.arrowId} />}
            </div>
          </CWPortal>
        ) : null}
      </>
    );
  }
}
