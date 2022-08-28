/* @jsx m */

import m from 'mithril';

import { CWText } from '../cw_text';
import { SharedPopoverAttrs, CWPopover } from './cw_popover';

export type TooltipType =
  | 'bordered'
  | 'singleLine'
  | 'solidArrow'
  | 'solidNoArrow';

type TooltipAttrs = {
  tooltipContent: string | m.Vnode;
} & SharedPopoverAttrs;

export class CWTooltip implements m.ClassComponent<TooltipAttrs> {
  view(vnode) {
    const {
      hoverCloseDelay = 1500,
      hoverOpenDelay,
      interactionType,
      persistOnHover,
      tooltipContent,
      tooltipType,
      toSide,
      trigger,
    } = vnode.attrs;

    return (
      <CWPopover
        content={
          typeof tooltipContent === 'string' ? (
            <CWText type="caption">{tooltipContent}</CWText>
          ) : (
            tooltipContent
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
