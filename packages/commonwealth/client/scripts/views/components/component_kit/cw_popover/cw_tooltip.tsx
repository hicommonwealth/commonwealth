/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_popover/cw_tooltip.scss';

import { AnchorType, Popover, usePopover } from './cw_popover';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';

type TooltipProps = {
  content: string | React.ReactNode;
  renderTrigger: (
    handleInteraction: (e: React.MouseEvent<AnchorType>) => void
  ) => React.ReactNode;
  hasBackground?: boolean;
};

export const CWTooltip = (props: TooltipProps) => {
  const { content, hasBackground, renderTrigger } = props;

  const popoverProps = usePopover();

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
};
