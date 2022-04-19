/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_tooltip.scss';

import { ComponentType } from './types';
import { CWButton } from './cw_button';
import { CWPopover } from './cw_popover';

type TooltipAttrs = {
  tooltipContent: string | m.Vnode;
  triggerLabel: string;
};
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
        <CWButton onclick={() => this.openPopover()} label={triggerLabel} />
        <CWPopover
          isOpen={this.isPopoverOpen}
          closePopover={() => this.closePopover()}
          content={<div class="tooltip-container">{tooltipContent}</div>}
        />
      </div>
    );
  }
}
