import React from 'react';

import 'components/component_kit/cw_popover/cw_tooltip.scss';

import { Popover, usePopover } from './cw_popover';
import type { PopoverTriggerProps } from './cw_popover';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { Placement } from '@popperjs/core/lib';

type TooltipProps = {
  content: string | React.ReactNode;
  hasBackground?: boolean;
  placement?: Placement;
} & PopoverTriggerProps;

export const CWTooltip = (props: TooltipProps) => {
  const { content, hasBackground, renderTrigger, placement } = props;

  const popoverProps = usePopover();

  return (
    <>
      {renderTrigger(popoverProps.handleInteraction)}
      <Popover
        placement={placement}
        content={
          typeof content === 'string' ? (
            <div
              className={getClasses<{ hasBackground?: boolean }>(
                { hasBackground },
                ComponentType.Tooltip
              )}
            >
              <CWText type="caption">{content}</CWText>
            </div>
          ) : (
            <div
              className={getClasses<{ hasBackground?: boolean }>(
                { hasBackground },
                ComponentType.Tooltip
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
