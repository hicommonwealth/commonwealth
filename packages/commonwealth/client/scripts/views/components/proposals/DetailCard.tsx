import React from 'react';

import { saveToClipboard } from 'client/scripts/utils/clipboard';
import moment from 'moment';
import { formatAddressShort } from 'shared/utils';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import './DetailCard.scss';
type DetailCardProps = {
  status: string;
  governanceType: string;
  publishDate: moment.Moment | number;
  id: string;
};
const DetailCard = ({
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

        {id ? (
          <div className="address">
            <CWText className="detail">
              {formatAddressShort(id, '', true, 8)}
            </CWText>
            <CWTooltip
              placement="top"
              content="address copied!"
              renderTrigger={(handleInteraction, isTooltipOpen) => {
                return (
                  <CWIconButton
                    iconName="copySimple"
                    onClick={(event) => {
                      saveToClipboard(id).catch(console.error);
                      handleInteraction(event);
                    }}
                    onMouseLeave={(e) => {
                      if (isTooltipOpen) {
                        handleInteraction(e);
                      }
                    }}
                    className="copy-icon"
                  />
                );
              }}
            />
          </div>
        ) : (
          <CWText>N/A</CWText>
        )}

        <CWText className="label">Attachments</CWText>
        <CWText className="detail">thread</CWText>
      </div>
    </div>
  );
};

export default DetailCard;
