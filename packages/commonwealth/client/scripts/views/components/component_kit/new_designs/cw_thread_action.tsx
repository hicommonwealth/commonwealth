import React, { FC } from 'react';
import {
  ArrowBendUpRight,
  BellSimple,
  BellSimpleSlash,
  DotsThree,
  ChatCenteredDots,
  ArrowFatUp,
} from '@phosphor-icons/react';

import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import 'components/component_kit/new_designs/cw_thread_action.scss';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';

export type ActionType =
  | 'upvote'
  | 'comment'
  | 'share'
  | 'subscribe'
  | 'overflow';

const commonProps = (disabled: boolean) => {
  return {
    className: getClasses({
      disabled,
    }),
    size: '18px',
  };
};

const renderPhosphorIcon = (
  action: ActionType,
  disabled: boolean,
  selected: boolean
) => {
  switch (action) {
    case 'upvote':
      return (
        <ArrowFatUp
          {...commonProps(disabled)}
          {...(selected ? { weight: 'fill' } : {})}
        />
      );
    case 'comment':
      return <ChatCenteredDots {...commonProps(disabled)} />;
    case 'share':
      return <ArrowBendUpRight {...commonProps(disabled)} />;
    case 'subscribe':
      return selected ? (
        <BellSimple {...commonProps(disabled)} />
      ) : (
        <BellSimpleSlash {...commonProps(disabled)} />
      );
    case 'overflow':
      return <DotsThree {...commonProps(disabled)} />;
    default:
      return null;
  }
};

type CWThreadActionProps = {
  disabled?: boolean;
  action?: ActionType;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  label?: string;
  selected?: boolean;
};

interface TooltipWrapperProps {
  disabled: boolean;
  text: string;
}

const TooltipWrapper: FC = ({
  children,
  disabled,
  text,
}: TooltipWrapperProps) => {
  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <CWTooltip
      disablePortal
      content={text}
      placement="top"
      renderTrigger={(handleInteraction) => (
        <div onMouseEnter={handleInteraction} onMouseLeave={handleInteraction}>
          {children}
        </div>
      )}
    />
  );
};

const getTooltipCopy = (action: ActionType) => {
  switch (action) {
    case 'upvote':
      return 'Join community to upvote';
    // todo distinguish reply vs comment
    case 'comment':
      return 'Join community to comment';
    case 'overflow':
      return 'Join community to view more actions';
    case 'subscribe':
      return 'Join community to subscribe';
    default:
      return '';
  }
};

export const CWThreadAction: FC<CWThreadActionProps> = ({
  disabled,
  action,
  onClick,
  label,
  selected,
}) => {
  const handleClick = (e) => {
    if (disabled) {
      return;
    }

    onClick?.(e);
  };

  return (
    <TooltipWrapper
      disabled={disabled}
      action={action}
      text={getTooltipCopy(action)}
    >
      <button
        onClick={handleClick}
        className={getClasses(
          {
            disabled,
            upvoteSelected: action === 'upvote' && selected,
          },
          ComponentType.ThreadAction
        )}
      >
        {renderPhosphorIcon(action, disabled, selected)}
        {action !== 'overflow' && action && (
          <CWText
            className={getClasses({
              disabled,
              upvoteSelected: action === 'upvote' && selected,
            })}
            type="caption"
            fontWeight="regular"
          >
            {label || action.charAt(0).toUpperCase() + action.slice(1)}
          </CWText>
        )}
      </button>
    </TooltipWrapper>
  );
};
