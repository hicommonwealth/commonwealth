/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_tooltip.scss';

import { ComponentType } from './types';
import { CWButton } from './cw_button';
import { CWPopover } from './cw_popover/cw_popover';

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
          toggle={() => <CWButton label={triggerLabel} />}
          popover={() => <div class="tooltip-container">{tooltipContent}</div>}
        />
      </div>
    );
  }
}
