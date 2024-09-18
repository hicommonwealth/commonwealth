import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import './SnapshotInfoRow.scss';

type SnapshotInfoLinkRowProps = {
  label: string;
  value: string | React.ReactNode;
  url: string;
};

export const SnapshotInfoLinkRow = ({
  label,
  url,
  value,
}: SnapshotInfoLinkRowProps) => {
  return (
    <div className="SnapshotInfoRow">
      <CWText type="caption" className="snapshot-info-row-label">
        {label}
      </CWText>
      <a href={url} target="_blank" rel="noreferrer">
        <CWText className="snapshot-link" noWrap>
          {value}
        </CWText>
        <CWIcon iconName="externalLink" iconSize="small" />
      </a>
    </div>
  );
};
