import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import './InfoBlock.scss';

export const InfoBlock = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="InfoBlock">
      <CWText type="caption" fontWeight="bold">
        {label}
      </CWText>
      <CWText type="b2">{value}</CWText>
    </div>
  );
};
