import moment from 'moment';
import React from 'react';

import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

type LockWithTooltip = {
  lockedAt: moment.Moment;
  updatedAt?: moment.Moment;
};

export const LockWithTooltip = ({ lockedAt, updatedAt }: LockWithTooltip) => {
  return (
    <CWTooltip
      content={
        lockedAt
          ? `Locked on ${lockedAt.format('DD/MM/YYYY')}`
          : `Locked prior to ${updatedAt?.format('DD/MM/YYYY') || 'N/A'}`
      }
      placement="top"
      renderTrigger={(handleInteraction) => (
        <CWIcon
          iconSize="small"
          iconName="keyLockClosed"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )}
    />
  );
};
