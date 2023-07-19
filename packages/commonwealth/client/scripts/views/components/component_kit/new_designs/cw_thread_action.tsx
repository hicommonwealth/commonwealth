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
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  label?: string;
  selected?: boolean;
};

export const CWThreadAction: FC<CWThreadActionProps> = ({
  disabled,
  action,
  onClick,
  label,
  selected,
}) => {
  return (
    <div
      className={getClasses(
        {
          disabled,
          upvoteSelected: action === 'upvote' && selected,
        },
        ComponentType.ThreadAction
      )}
      onClick={onClick}
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
    </div>
  );
};
