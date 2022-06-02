/* @jsx m */

import m from 'mithril';

import { CWPopover, SharedPopoverAttrs } from './cw_popover/cw_popover';
import { CWText } from './cw_text';

export type TooltipType =
  | 'bordered'
  | 'singleLine'
  | 'solidArrow'
  | 'solidNoArrow';

type TooltipAttrs = {
  tooltipText: string;
} & SharedPopoverAttrs;

// Gabe 6/1/22 TODO: We probably need a hoverCloseDelay too,
// but maybe hardcoded as opposed to an attr. Via Aden:
// "[tooltip] should only exist for 1.5 seconds on hover
// otherwise disappearing until they hover again"

export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  view(vnode) {
    const {
      hoverCloseDelay,
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
        hoverCloseDelay={hoverCloseDelay}
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
