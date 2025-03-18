import React from 'react';

import { CWText } from '../component_kit/cw_text';
import './DeatilsCard.scss';

const DetailsCard = () => {
  return (
    <div className="DetailCard">
      <div className="header">
        <CWText type="h5" fontWeight="semiBold">
          Details
        </CWText>
      </div>
      <div className="rb-container">
        <CWText className="label">Status</CWText>

        <CWText className="detail">Status</CWText>

        <CWText className="label">GovernanceType</CWText>

        <CWText className="detail">GovernanceType</CWText>

        <CWText className="label">Date Proposed</CWText>

        <CWText className="detail">DD/MM/YYYY</CWText>

        <CWText className="label">ID</CWText>

        <CWText className="detail">DD/MM/YYYY</CWText>
      </div>
    </div>
  );
};

export default DetailsCard;
