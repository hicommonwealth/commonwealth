import React from 'react';

import 'components/component_kit/cw_popover/cw_tooltip.scss';

import { Placement } from '@popperjs/core/lib';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import type { PopoverTriggerProps } from './cw_popover';
import { Popover, usePopover } from './cw_popover';

type TooltipProps = {
  content: string | React.ReactNode;
  hasBackground?: boolean;
  placement?: Placement;
  disablePortal?: boolean;
} & PopoverTriggerProps;

// TODO remove or make it CWPopover
export const CWTooltip = ({
  content,
  hasBackground,
  renderTrigger,
  placement,
  disablePortal,
}: TooltipProps) => {
  const popoverProps = usePopover();

  if (!content) {
    return <>{renderTrigger(popoverProps.handleInteraction)}</>;
  }

  return (
    <>
      {renderTrigger(popoverProps.handleInteraction)}
      <Popover
        disablePortal={disablePortal}
        placement={placement}
        content={
          typeof content === 'string' ? (
            <div
              className={getClasses<{ hasBackground?: boolean }>(
                { hasBackground },
                ComponentType.OldTooltip,
              )}
            >
              <CWText type="caption">{content}</CWText>
            </div>
          ) : (
            <div
              className={getClasses<{ hasBackground?: boolean }>(
                { hasBackground },
                ComponentType.OldTooltip,
              )}
            >
              {content}
            </div>
          )
        }
        {...popoverProps}
      />
    </>
  );
};
