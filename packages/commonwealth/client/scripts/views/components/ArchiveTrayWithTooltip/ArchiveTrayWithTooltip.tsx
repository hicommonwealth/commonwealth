import moment from 'moment';
import React from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';

type ArchiveTrayWithTooltipProps = {
  archivedAt: moment.Moment;
};

export const ArchiveTrayWithTooltip = ({
  archivedAt,
}: ArchiveTrayWithTooltipProps) => {
  return (
    <CWTooltip
      placement="right"
      content={`Archived on ${archivedAt.format('DD/MM/YYYY')}`}
      renderTrigger={(handleInteraction) => (
        <CWIcon
          iconName="archiveTrayFilled"
          iconSize="small"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )}
    />
  );
};
