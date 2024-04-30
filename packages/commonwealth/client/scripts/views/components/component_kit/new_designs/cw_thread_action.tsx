import {
  ArrowBendUpRight,
  ArrowFatUp,
  BellSimple,
  BellSimpleSlash,
  ChatCenteredDots,
  Coins,
  DotsThree,
  Trophy,
} from '@phosphor-icons/react';
import React, { FC } from 'react';

import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import 'components/component_kit/new_designs/cw_thread_action.scss';

export type ActionType =
  | 'upvote'
  | 'comment'
  | 'reply'
  | 'share'
  | 'subscribe'
  | 'overflow'
  | 'view-upvotes'
  | 'leaderboard'
  | 'winners'
  | 'fund';

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
  selected: boolean,
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
    case 'reply':
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
    case 'leaderboard':
      return <ArrowFatUp />;
    case 'winners':
      return <Trophy />;
    case 'fund':
      return <Coins />;
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
  isThreadArchived?: boolean;
  tooltipText?: string;
  hideToolTip?: boolean;
  className?: string;
};

interface TooltipWrapperProps {
  disabled: boolean;
  text: string;
  children: JSX.Element;
}

// Tooltip should only wrap the ThreadAction when the button is disabled
export const TooltipWrapper = ({
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
        <div
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            if (disabled) return;
          }}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        >
          {children}
        </div>
      )}
    />
  );
};

const getTooltipCopy = (action: ActionType, isThreadArchived: boolean) => {
  if (isThreadArchived) {
    return 'Thread is archived';
  }

  switch (action) {
    case 'upvote':
      return 'Join community to upvote';
    case 'comment':
      return 'Join community to comment';
    case 'reply':
      return 'Join community to reply';
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
  isThreadArchived,
  tooltipText,
  hideToolTip,
  className,
}) => {
  const handleClick = (e) => {
    if (disabled) {
      return;
    }

    onClick?.(e);
  };

  const upvoteSelected = action === 'upvote' && selected;

  return (
    <TooltipWrapper
      disabled={disabled}
      {...(!hideToolTip && {
        text: tooltipText || getTooltipCopy(action, isThreadArchived),
      })}
    >
      <button
        onClick={handleClick}
        className={getClasses(
          {
            disabled,
            upvoteSelected,
            className,
          },
          ComponentType.ThreadAction,
        )}
      >
        {renderPhosphorIcon(action, disabled, selected)}
        {action !== 'overflow' && action && label && (
          <CWText
            className={getClasses({
              disabled,
              upvoteSelected,
            })}
            type="caption"
            fontWeight="regular"
          >
            {label}
          </CWText>
        )}
      </button>
    </TooltipWrapper>
  );
};
