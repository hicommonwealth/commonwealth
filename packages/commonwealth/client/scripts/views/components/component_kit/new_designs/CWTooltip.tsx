import React, { FC } from 'react';

import 'components/component_kit/new_designs/CWTooltip.scss';

import { Placement } from '@popperjs/core/lib';
import type { PopoverTriggerProps } from '../cw_popover/cw_popover';
import { Popover, usePopover } from '../cw_popover/cw_popover';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

type TooltipProps = {
  content: string | React.ReactNode;
  placement?: Placement;
  disablePortal?: boolean;
} & PopoverTriggerProps;

type ContainerProps = {
  placement: Placement;
  children: React.ReactNode;
};

const Container: FC<ContainerProps> = ({ placement, children }) => {
  return (
    <div className={getClasses({ placement }, ComponentType.Tooltip)}>
      {children}
      <div
        className={getClasses(
          {
            placement,
            Arrow: true,
            tipTop: placement === 'top',
            tipRight: placement === 'right',
            tipBottom: placement === 'bottom',
            tipLeft: placement === 'left',
          },
          ComponentType.Tooltip
        )}
      />
    </div>
  );
};

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
            <Container placement={placement}>
              <CWText type="caption">{content}</CWText>
            </Container>
          }
          {...popoverProps}
        />
      )}
    </>
  );
};
