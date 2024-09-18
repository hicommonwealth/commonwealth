import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';

import './SnapshotInfoRow.scss';

type SnapshotInfoRowProps = {
  label: string;
  value: string | React.ReactNode;
};

export const SnapshotInfoRow = ({ label, value }: SnapshotInfoRowProps) => {
  return (
    <div className="SnapshotInfoRow">
      <CWText type="caption" className="snapshot-info-row-label">
        {label}
      </CWText>
      <CWText noWrap>{value}</CWText>
    </div>
  );
};
