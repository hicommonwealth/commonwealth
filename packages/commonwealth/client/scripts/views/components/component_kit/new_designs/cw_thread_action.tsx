import React, { FC, useState } from 'react';
import {
  ArrowBendUpRight,
  BellSimple,
  BellSimpleSlash,
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
  isHovering: boolean,
  selected: boolean
) => {
  switch (action) {
    case 'comment':
      return <ChatCenteredDots {...commonProps(disabled, isHovering)} />;
    case 'share':
      return <ArrowBendUpRight {...commonProps(disabled, isHovering)} />;
    case 'subscribe':
      return selected ? (
        <BellSimple {...commonProps(disabled, isHovering)} />
      ) : (
        <BellSimpleSlash {...commonProps(disabled, isHovering)} />
      );
    case 'overflow':
      return <DotsThree {...commonProps(disabled, isHovering)} />;
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
      {renderPhosphorIcon(action, disabled, isHovering, selected)}
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
          {label || action.charAt(0).toUpperCase() + action.slice(1)}
        </CWText>
      )}
    </div>
  );
};
