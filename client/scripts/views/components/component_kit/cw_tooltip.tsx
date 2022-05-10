/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_tooltip.scss';

import { ComponentType } from './types';
import { CWButton } from './cw_button';
import { CWPopover } from './cw_popover/cw_popover';
import { PopoverChildAttrs, PopoverToggleAttrs } from './cw_popover/types';

type TooltipAttrs = {
  tooltipContent: string | m.Vnode;
  triggerLabel: string;
};
export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  view(vnode) {
    const { triggerLabel, tooltipContent } = vnode.attrs;

    return (
      <div class={ComponentType.Tooltip}>
        <CWPopover
          toggle={(attrs: PopoverToggleAttrs) => (
            <CWButton label={triggerLabel} onclick={attrs.onClick} />
          )}
          popover={(attrs: PopoverChildAttrs) => (
            <div position={attrs.position} class="tooltip-container">
              {tooltipContent}
            </div>
          )}
        />
      </div>
    );
  }
}
