/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import { AnchorType, Popover, usePopover } from './cw_popover';
import { CWText } from '../cw_text';

export type TooltipType =
  | 'bordered'
  | 'singleLine'
  | 'solidArrow'
  | 'solidNoArrow';

type TooltipProps = {
  content: string | React.ReactNode;
  renderTrigger: (
    handleInteraction: (e: React.MouseEvent<AnchorType>) => void
  ) => React.ReactNode;
  tooltipType?: TooltipType;
};

export const CWTooltip = (props: TooltipProps) => {
  const { content, tooltipType, renderTrigger } = props;

  const popoverProps = usePopover();

  return (
    <React.Fragment>
      {renderTrigger(popoverProps.handleInteraction)}
      <Popover
        content={
          typeof content === 'string' ? (
            <CWText type="caption">{content}</CWText>
          ) : (
            <div>{content}</div>
          )
        }
        {...popoverProps}
      />
    </React.Fragment>
  );
};
