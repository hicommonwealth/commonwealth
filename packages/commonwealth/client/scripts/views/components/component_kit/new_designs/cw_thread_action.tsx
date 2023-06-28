import React, { FC } from 'react';
import {
  ArrowBendUpRight,
  ArrowFatUp,
  BellSimple,
  DotsThree,
  ChatCenteredDots,
} from '@phosphor-icons/react';

import { CWText } from '../cw_text';

import 'components/component_kit/new_designs/cw_thread_action.scss';

type CWThreadActionProps = {
  disabled?: boolean;
  count?: number;
};

export const CWThreadAction: FC<CWThreadActionProps> = ({
  disabled,
  count,
}) => {
  return (
    <div className="ThreadAction">
      <ChatCenteredDots />
      <CWText type="caption" fontWeight="regular">
        Comment
      </CWText>
    </div>
  );
};
