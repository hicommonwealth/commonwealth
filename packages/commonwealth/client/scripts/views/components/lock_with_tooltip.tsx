import moment from 'moment';
import React from 'react';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWTooltip } from './component_kit/cw_popover/cw_tooltip';

type LockWithTooltip = {
  lockedAt: moment.Moment;
  updatedAt?: moment.Moment;
};

export const LockWithTooltip = ({ lockedAt, updatedAt }: LockWithTooltip) => {
  return (
    <CWTooltip
      hasBackground={true}
      placement="top"
      content={
        lockedAt
          ? `Locked on ${lockedAt.format('MM/DD/YYYY')}`
          : `Locked prior to ${updatedAt?.format('MM/DD/YYYY') || 'N/A'}`
      }
      renderTrigger={(handleInteraction) => (
        <CWIcon
          iconName="keyLockClosed"
          iconSize="small"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )}
    />
  );
};
