import React from 'react';

import { CWText } from '../component_kit/cw_text';
import './DeatilsCard.scss';
const timelineEvents = [
  {
    date: '10/02/2024',
    title: 'Proposal Published',
    type: 'past',
    iconName: 'plusCirclePhosphor',
  },
  {
    date: '15/02/2024',
    title: 'Voting begins',
    type: 'active',
    iconName: 'vector',
  },
  {
    date: '18/02/2024',
    title: 'Voting ends',
    type: 'coming',
    iconName: 'infoEmpty',
  },
];

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
