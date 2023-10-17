import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import moment from 'moment';
import './ArchiveMsg.scss';

type ArchiveMsgProps = {
  archivedAt: moment.Moment | null;
};

export const ArchiveMsg = ({ archivedAt }: ArchiveMsgProps) => {
  return (
    <div className="ArchiveMsg">
      <div className="archive-msg-container">
        <CWIcon iconName="archiveTrayFilled" iconSize="small" />
        {`This thread was archived on ${moment(archivedAt).format(
          'MM/DD/YYYY'
        )},
      meaning it can no longer be edited or commented on.`}
      </div>
    </div>
  );
};
