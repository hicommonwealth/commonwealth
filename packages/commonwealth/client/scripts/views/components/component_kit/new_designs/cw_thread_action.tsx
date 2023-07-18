import React, { FC, useState } from 'react';
import {
  ArrowBendUpRight,
  BellSimple,
  DotsThree,
  ChatCenteredDots,
} from '@phosphor-icons/react';

import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import 'components/component_kit/new_designs/cw_thread_action.scss';

export type ActionType = 'comment' | 'share' | 'subscribe' | 'overflow';

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
  action: ActionType,
  disabled: boolean,
  isHovering: boolean
) => {
  switch (action) {
    case 'comment':
      return <ChatCenteredDots {...commonProps(disabled, isHovering)} />;
    case 'share':
      return <ArrowBendUpRight {...commonProps(disabled, isHovering)} />;
    case 'subscribe':
      return <BellSimple {...commonProps(disabled, isHovering)} />;
    case 'overflow':
      return <DotsThree {...commonProps(disabled, isHovering)} />;
    default:
      return null;
  }
};

type CWThreadActionProps = {
  disabled?: boolean;
  action?: ActionType;
  onClick: () => void;
};

export const CWThreadAction: FC<CWThreadActionProps> = ({
  disabled,
  action,
  onClick,
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
      onClick={onClick}
    >
      {renderPhosphorIcon(action, disabled, isHovering)}
      {action !== 'overflow' && action && (
        <CWText
          className={getClasses({
            hover: isHovering,
            default: !isHovering,
            disabled,
          })}
          type="caption"
          fontWeight="regular"
        >
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </CWText>
      )}
    </div>
  );
};
