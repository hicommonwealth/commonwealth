import React from 'react';

import moment from 'moment';
import { CWText } from '../component_kit/cw_text';
import './DeatilsCard.scss';
type DetailCardProps = {
  status: string;
  governanceType: string;
  publishDate: moment.Moment | number;
  id: string;
};
const DetailsCard = ({
  status,
  governanceType,
  publishDate,
  id,
}: DetailCardProps) => {
  return (
    <div className="DetailCard">
      <div className="header">
        <CWText type="h5" fontWeight="semiBold">
          Details
        </CWText>
      </div>
      <div className="rb-container">
        <CWText className="label">Status</CWText>
        <CWText className="status">{status}</CWText>
        <CWText className="label">GovernanceType</CWText>

        <CWText className="detail">{governanceType}</CWText>

        <CWText className="label">Date Proposed</CWText>

        <CWText className="detail">
          {moment(publishDate, 'X')?.utc?.()?.local?.()?.format('DD/MM/YYYY')}
        </CWText>

        <CWText className="label">ID</CWText>

        <CWText className="detail">{id}</CWText>
        <CWText className="label">Attachments</CWText>
        <CWText className="detail">thread</CWText>
      </div>
    </div>
  );
};

export default DetailsCard;
