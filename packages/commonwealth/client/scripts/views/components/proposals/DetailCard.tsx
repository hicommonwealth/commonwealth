import React, { useState } from 'react';

import { saveToClipboard } from 'client/scripts/utils/clipboard';
import clsx from 'clsx';
import moment from 'moment';
import { useNavigate } from 'react-router';
import { formatAddressShort } from 'shared/utils';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import './DetailCard.scss';

type DetailCardProps = {
  status: string;
  scope?: string;
  governanceType: string;
  publishDate: moment.Moment | number;
  id?: string;
  Threads: { id: number; title: string }[];
};

const DetailCard = ({
  status,
  scope = '',
  governanceType,
  publishDate,
  id = '',
  Threads = [],
}: DetailCardProps) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={clsx('DetailCard', { isCollapsed: isCollapsed })}>
      <div className="detail-card-header">
        <CWText type="h5" fontWeight="semiBold">
          Details
        </CWText>
        <CWIcon
          iconName={isCollapsed ? 'caretDown' : 'caretUp'}
          iconSize="small"
          className="caret-icon"
          weight="bold"
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
      {!isCollapsed && (
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
          {Threads.length ? (
            Threads.map((thread) => (
              <div
                className="link"
                onClick={() =>
                  navigate(`/${scope}/discussion/${thread.id}-${thread.title}`)
                }
                key={thread.id}
              >
                <CWText className="detail">{thread.title}</CWText>
              </div>
            ))
          ) : (
            <CWText>N/A</CWText>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailCard;
