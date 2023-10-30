import React, { FC } from 'react';

import 'components/component_kit/new_designs/CWTooltip.scss';

import { Placement } from '@popperjs/core/lib';
import type { PopoverTriggerProps } from '../../cw_popover/cw_popover';
import { Popover, usePopover } from '../../cw_popover/cw_popover';
import { CWText } from '../../cw_text';
import { TooltipContainer } from './TooltipContainer';

type TooltipProps = {
  content: string | React.ReactNode;
  placement?: Placement;
  disablePortal?: boolean;
} & PopoverTriggerProps;

export const CWTooltip: FC<TooltipProps> = ({
  content,
  renderTrigger,
  placement,
  disablePortal,
}) => {
  const popoverProps = usePopover();

  return (
    <>
      {renderTrigger(popoverProps.handleInteraction, popoverProps.open)}
      {content && (
        <Popover
          disablePortal={disablePortal}
          placement={placement}
          content={
            <TooltipContainer placement={placement}>
              <CWText type="caption">{content}</CWText>
            </TooltipContainer>
          }
          {...popoverProps}
        />
      )}
    </>
  );
};
