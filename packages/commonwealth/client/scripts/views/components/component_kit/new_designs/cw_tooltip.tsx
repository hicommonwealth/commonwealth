import React from 'react';

import 'components/component_kit/new_designs/cw_tooltip.scss';

import { Popover, usePopover } from '../cw_popover/cw_popover';
import type { PopoverTriggerProps } from '../cw_popover/cw_popover';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { Placement } from '@popperjs/core/lib';

type TooltipProps = {
  content: string | React.ReactNode;
  placement?: Placement;
} & PopoverTriggerProps;

type ContainerProps = {
  placement: Placement;
  children: React.ReactNode;
};

const formatText = (content: string): string => {
  return content.length > 75 ? content.slice(0, 75).concat('...') : content;
};

const Container = (props: ContainerProps) => {
  const { placement, children } = props;

  return (
    <div
      className={getClasses(
        {
          placement,
        },
        ComponentType.Tooltip
      )}
    >
      {children}
      <div
        className={getClasses({
          placement,
          tipTop: placement === 'top',
          tipRight: placement === 'right',
          tipBottom: placement === 'bottom',
          tipLeft: placement === 'left',
        })}
      />
    </div>
  );
};

export const CWTooltip = (props: TooltipProps) => {
  const { content, renderTrigger, placement } = props;

  const popoverProps = usePopover();

  return (
    <>
      {renderTrigger(popoverProps.handleInteraction)}
      <Popover
        placement={placement}
        content={
          typeof content === 'string' ? (
            <Container placement={placement}>
              <CWText type="caption">{formatText(content)}</CWText>
            </Container>
          ) : (
            <Container placement={placement}>{content}</Container>
          )
        }
        {...popoverProps}
      />
    </>
  );
};
