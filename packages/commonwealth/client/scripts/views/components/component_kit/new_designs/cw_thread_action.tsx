import React, { FC, useState } from 'react';
import {
  ArrowBendUpRight,
  ArrowFatUp,
  BellSimple,
  DotsThree,
  ChatCenteredDots,
} from '@phosphor-icons/react';

import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import 'components/component_kit/new_designs/cw_thread_action.scss';

export type ActionType =
  | 'comment'
  | 'share'
  | 'subscribe'
  | 'upvote'
  | 'overflow';

const commonProps = (disabled: boolean, isHovering: boolean) => {
  return {
    className: getClasses({
      disabled,
      hover: isHovering,
    }),
    size: '20px',
  };
};

const renderPhosphorIcon = (
  label: ActionType,
  disabled: boolean,
  isHovering: boolean
) => {
  switch (label) {
    case 'comment':
      return <ChatCenteredDots {...commonProps(disabled, isHovering)} />;
    case 'share':
      return <ArrowBendUpRight {...commonProps(disabled, isHovering)} />;
    case 'subscribe':
      return <BellSimple {...commonProps(disabled, isHovering)} />;
    case 'upvote':
      return <ArrowFatUp {...commonProps(disabled, isHovering)} />;
    case 'overflow':
      return <DotsThree {...commonProps(disabled, isHovering)} />;
    default:
      return null;
  }
};

type CWThreadActionProps = {
  disabled?: boolean;
  label?: ActionType;
  count?: number;
};

export const CWThreadAction: FC<CWThreadActionProps> = ({
  disabled,
  label,
  count,
}) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const handleOnMouseOver = () => {
    if (!disabled) {
      setIsHovering(true);
    }
  };

  const handleOnMouseLeave = () => setIsHovering(false);

  return (
    <div
      className={getClasses(
        {
          disabled,
          hover: isHovering,
        },
        ComponentType.ThreadAction
      )}
      onMouseOver={handleOnMouseOver}
      onMouseLeave={handleOnMouseLeave}
    >
      {renderPhosphorIcon(label, disabled, isHovering)}
      {label !== 'overflow' && (label || count) && (
        <CWText
          className={getClasses({
            disabled,
            hover: isHovering,
            default: !isHovering,
          })}
          type="caption"
          fontWeight="regular"
        >
          {count ? count : label.charAt(0).toUpperCase() + label.slice(1)}
        </CWText>
      )}
    </div>
  );
};
