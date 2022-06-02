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
  tooltipContents: string | m.Vnode;
} & SharedPopoverAttrs;

export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  view(vnode) {
    const {
      hoverCloseDelay = 1500,
      hoverOpenDelay,
      interactionType,
      persistOnHover,
      tooltipContents,
      tooltipType,
      toSide,
      trigger,
    } = vnode.attrs;

    return (
      <CWPopover
        content={
          typeof tooltipContents === 'string' ? (
            <CWText type="caption">{tooltipContents}</CWText>
          ) : (
            tooltipContents
          )
        }
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
