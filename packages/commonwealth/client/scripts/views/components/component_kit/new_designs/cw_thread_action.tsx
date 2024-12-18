import {
  ArrowBendUpRight,
  ArrowFatUp,
  BellSimple,
  ChatCenteredDots,
  Coins,
  DotsThree,
  Translate,
} from '@phosphor-icons/react';
import React, { FC } from 'react';

import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import './cw_thread_action.scss';

export type ActionType =
  | 'upvote'
  | 'comment'
  | 'reply'
  | 'share'
  | 'subscribe'
  | 'overflow'
  | 'view-upvotes'
  | 'leaderboard'
  | 'fund'
  | 'translate';

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
      return <BellSimple {...commonProps(disabled)} />;
    case 'overflow':
      return <DotsThree {...commonProps(disabled)} />;
    case 'leaderboard':
      return <ArrowFatUp />;
    case 'fund':
      return <Coins />;
    case 'translate':
      return <Translate {...commonProps(disabled)} />;
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

// eslint-disable-next-line react/no-multi-comp
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
      // @ts-expect-error <StrictNullChecks/>
      disabled={disabled}
      {...(!hideToolTip && {
        // @ts-expect-error <StrictNullChecks/>
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
        {/* @ts-expect-error StrictNullChecks*/}
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
