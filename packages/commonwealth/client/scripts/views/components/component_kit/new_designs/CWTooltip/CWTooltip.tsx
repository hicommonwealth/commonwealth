import React, { FC, ReactNode } from 'react';

import './CWTooltip.scss';

import type { VirtualElement } from '@popperjs/core';
import { Placement } from '@popperjs/core/lib';
import CWPopover, {
  PopoverTriggerProps,
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWText } from '../../cw_text';
import { TooltipContainer } from './TooltipContainer';

export type TooltipProps = {
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

  const handleInteraction = (e: React.MouseEvent<HTMLElement>) => {
    const { type, clientX, clientY, currentTarget } = e;

    if (type === 'mouseleave') {
      popoverProps.setAnchorEl(null);
      return;
    }

    const x = clientX;
    const y = clientY;
    const contextEl = currentTarget as HTMLElement;

    const virtualElement: VirtualElement = {
      getBoundingClientRect: () => ({
        x: x,
        y: y,
        width: 0,
        height: 0,
        top: y,
        bottom: y,
        left: x,
        right: x,
        toJSON: () => ({}),
      } as DOMRect),
      contextElement: contextEl,
    };

    popoverProps.setAnchorEl(virtualElement);
  };

  return (
    <>
      {renderTrigger(handleInteraction, popoverProps.open)}
      {content && (
        <CWPopover
          disablePortal={disablePortal}
          placement={placement}
          content={
            // @ts-expect-error <StrictNullChecks/>
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

export const withTooltip = (
  children: ReactNode,
  content: string,
  shouldDisplay: boolean,
  containerClassName?: string,
) => {
  if (!shouldDisplay) return children;

  return (
    <CWTooltip
      placement="bottom"
      content={content}
      renderTrigger={(handleInteraction) => (
        <span
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          className={containerClassName}
        >
          {children}
        </span>
      )}
    />
  );
};
