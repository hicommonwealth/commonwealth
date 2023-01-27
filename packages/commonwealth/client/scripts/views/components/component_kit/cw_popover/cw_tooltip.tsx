/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import { Popover, usePopover } from './cw_popover';
import { CWText } from '../cw_text';

export type TooltipType =
  | 'bordered'
  | 'singleLine'
  | 'solidArrow'
  | 'solidNoArrow';

type TooltipProps = {
  content: string | React.ReactNode;
  tooltipType?: TooltipType;
  trigger: React.ReactNode;
};

export const CWTooltip = (props: TooltipProps) => {
  const { content, tooltipType, trigger } = props;

  const popoverProps = usePopover();

  return (
    <div>
      {/* <CWIconButton
            iconName="infoEmpty"
            onMouseEnter={hoverPopoverProps.handleInteraction}
            onMouseLeave={hoverPopoverProps.handleInteraction}
          /> */}
      <Popover
        content={
          typeof content === 'string' ? (
            <CWText type="caption">{content}</CWText>
          ) : (
            content
          )
        }
        // tooltipType={tooltipType}
        // trigger={trigger}
        {...popoverProps}
      />
    </div>
  );
};
