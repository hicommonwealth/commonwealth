/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_popover.scss';

import { ComponentType } from './types';
import { CWButton } from './cw_button';

type PopoverAttrs = {
  content: m.Vnode;
  isOpen: boolean;
  closePopover: () => void;
};

export class CWPopover implements m.ClassComponent<PopoverAttrs> {
  view(vnode) {
    const { content, isOpen, closePopover } = vnode.attrs;
    return isOpen ? (
      <div class={ComponentType.Popover}>
        <div class="popover-content-container">{content}</div>
        <div onclick={closePopover} class="overlay-background"></div>
      </div>
    ) : null;
  }
}

type TooltipAttrs = {
  triggerLabel: string;
  tooltipContent: m.Vnode;
}
export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  isPopoverOpen: boolean;

  constructor() {
    this.isPopoverOpen = false;
  }

  openPopover() {
    this.isPopoverOpen = true;
  }

  closePopover() {
    this.isPopoverOpen = false;
  }

  view(vnode) {
    const { triggerLabel, tooltipContent } = vnode.attrs;

    return (
      <div class={ComponentType.Tooltip}>
          <CWButton
            onclick={() => this.openPopover()}
            label={triggerLabel}
          />
          <CWPopover
            isOpen={this.isPopoverOpen}
            closePopover={() => this.closePopover()}
            content={tooltipContent}
          />
      </div>
    )
  }
}