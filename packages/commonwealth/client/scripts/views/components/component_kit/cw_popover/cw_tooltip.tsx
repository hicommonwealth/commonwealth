/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import { CWText } from '../cw_text';
import type { SharedPopoverAttrs } from './cw_popover';
import { CWPopover } from './cw_popover';

export type TooltipType =
  | 'bordered'
  | 'singleLine'
  | 'solidArrow'
  | 'solidNoArrow';

type TooltipAttrs = {
  tooltipContent: string | m.Vnode;
} & SharedPopoverAttrs;

export class CWTooltip extends ClassComponent<TooltipAttrs> {
  view(vnode: m.Vnode<TooltipAttrs>) {
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
