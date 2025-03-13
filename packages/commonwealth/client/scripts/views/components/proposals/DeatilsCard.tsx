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
        <CWText type="b1" className="label">
          Status
        </CWText>

        <CWText type="b1" className="title">
          Status
        </CWText>

        <CWText type="b1" className="label">
          GovernanceType
        </CWText>

        <CWText type="b1" className="title">
          GovernanceType
        </CWText>

        <CWText type="b1" className="label">
          Date Proposed
        </CWText>

        <CWText type="b1" className="title">
          DD/MM/YYYY
        </CWText>

        <CWText type="b1" className="label">
          ID
        </CWText>

        <CWText type="b1" className="title">
          DD/MM/YYYY
        </CWText>
      </div>
    </div>
  );
};

export default DetailsCard;
