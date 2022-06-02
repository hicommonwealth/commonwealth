/* @jsx m */

import m from 'mithril';

import { CWPopover, SharedPopoverAttrs } from './cw_popover/cw_popover';
import { CWText } from './cw_text';

export type TooltipType =
  | 'bordered'
  | 'solidArrow'
  | 'solidNoArrow'
  | 'singleLine';

type TooltipAttrs = {
  tooltipText: string;
  tooltipType: TooltipType;
} & SharedPopoverAttrs;

export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  view(vnode) {
    const {
      hoverOpenDelay,
      interactionType,
      persistOnHover,
      tooltipText,
      tooltipType,
      toSide,
      trigger,
    } = vnode.attrs;

    return (
      <CWPopover
        content={<CWText type="caption">{tooltipText}</CWText>}
        hoverOpenDelay={hoverOpenDelay}
        interactionType={interactionType}
        persistOnHover={persistOnHover}
        tooltipType={tooltipType}
        toSide={toSide}
        trigger={trigger}
      />
    );
  }
}
