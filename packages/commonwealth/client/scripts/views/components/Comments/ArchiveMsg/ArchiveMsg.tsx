import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import moment from 'moment';

export const ArchiveMsg = ({
  archivedAt,
}) => {
  return (
    <div className="archive-msg-container">
      <div className="archive-msg">
      <CWIcon
        iconName="archiveTrayFilled"
        iconSize="small"
      />
      {`This thread was archived on ${moment(archivedAt).format('MM/DD/YYYY')},
      meaning it can no longer be edited or commented on.`}
      </div>
    </div>
  )
}