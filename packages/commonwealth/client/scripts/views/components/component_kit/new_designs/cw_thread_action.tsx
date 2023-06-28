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

import 'components/component_kit/new_designs/cw_thread_action.scss';

// type CWThreadActionStyleProps = {
//   disabled?: boolean;
//   isHovering?: boolean;
// };

type CWThreadActionProps = {
  disabled?: boolean;
  label?: string;
  count?: number;
};

export const CWThreadAction: FC<CWThreadActionProps> = ({
  disabled,
  label,
  count,
}) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const handleOnMouseOver = () => {
    console.log('is hovering...');
    if (!disabled) {
      setIsHovering(true);
    }
  };

  const handleOnMouseLeave = () => setIsHovering(false);

  const getIconColor = () => {
    return disabled ? '#A09DA1' : isHovering ? '#514E52' : '#656167';
  };

  return (
    <div
      className="ThreadAction"
      onMouseOver={handleOnMouseOver}
      onMouseLeave={handleOnMouseLeave}
    >
      <ChatCenteredDots color={getIconColor()} />
      {label && (
        <CWText
          // return the key if value is bool, otherwise return value
          className={getClasses({
            disabled,
            hover: isHovering ? 'hover' : '',
          })}
          type="caption"
          fontWeight="regular"
        >
          {label}
        </CWText>
      )}
    </div>
  );
};
