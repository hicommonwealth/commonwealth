/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_popover/cw_tooltip.scss';

import { AnchorType, Popover, usePopover } from './cw_popover';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';

export type TooltipType = 'solidBackground' | 'singleLine';

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
            <div
              className={getClasses<{ tooltipType?: TooltipType }>(
                { tooltipType },
                ComponentType.Tooltip
              )}
            >
              <CWText type="caption">{content}</CWText>
            </div>
          ) : (
            <div
              className={getClasses<{ tooltipType?: TooltipType }>(
                { tooltipType },
                ComponentType.Tooltip
              )}
            >
              {content}
            </div>
          )
        }
        {...popoverProps}
      />
    </React.Fragment>
  );
};
