import 'components/component_kit/cw_popover/cw_tooltip.scss';
import React from 'react';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import type { PopoverTriggerProps } from './cw_popover';
import { Popover, usePopover } from './cw_popover';

type TooltipProps = {
  content: string | React.ReactNode;
  hasBackground?: boolean;
} & PopoverTriggerProps;

export const CWTooltip = (props: TooltipProps) => {
  const { content, hasBackground, renderTrigger } = props;

  const popoverProps = usePopover();

  return (
    <>
      {renderTrigger(popoverProps.handleInteraction)}
      <Popover
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
