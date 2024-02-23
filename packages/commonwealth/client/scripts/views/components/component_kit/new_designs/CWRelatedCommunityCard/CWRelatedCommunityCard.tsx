import type ChainInfo from 'client/scripts/models/ChainInfo';
import { isCommandClick, pluralizeWithoutNumberPrefix } from 'helpers';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../../shared/analytics/types';
import { CWCommunityAvatar } from '../../cw_community_avatar';
import { CWIcon } from '../../cw_icons/cw_icon';
import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import './CWRelatedCommunityCard.scss';
import { addPeriodToText } from './utils';

type CWRelatedCommunityCardProps = {
  id: string;
  communityName: string;
  communityIconUrl: string;
  communityDescription: string;
  memberCount: string;
  threadCount: string;
  actions?: JSX.Element;
};

export const CWRelatedCommunityCard = ({
  id,
  communityName,
  communityIconUrl,
  communityDescription,
  memberCount,
  threadCount,
  actions,
}: CWRelatedCommunityCardProps) => {
  const navigate = useCommonNavigate();
  const communityAvatar = {
    iconUrl: communityIconUrl,
    name: communityName,
  } as ChainInfo;

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  const handleClick = useCallback(
    (e, communityId: string) => {
      e.preventDefault();
      trackAnalytics({
        event: MixpanelClickthroughEvent.DIRECTORY_TO_COMMUNITY_PAGE,
      });
      if (isCommandClick(e)) {
        window.open(`/${communityId}`, '_blank');
        return;
      }
      navigateToCommunity({ navigate, path: '', chain: communityId });
    },
    [navigate, trackAnalytics],
  );

  return (
    <div
      className={ComponentType.RelatedCommunityCard}
      onClick={(e) => handleClick(e, id)}
    >
      <div className="content-container">
        <div className="top-content">
          <div className="header">
            <CWCommunityAvatar community={communityAvatar} size="large" />
            <CWText type="h5" title={communityName} fontWeight="medium">
              {communityName}
            </CWText>
          </div>
          <div className="description">
            {communityDescription
              ? addPeriodToText(communityDescription)
              : null}
          </div>
        </div>
        <div className="metadata">
          <div className="member-data">
            <CWIcon iconName="users" iconSize="small" />
            <span className="count">
              {Number(memberCount).toLocaleString('en-US')}
            </span>

            <span className="text">
              {pluralizeWithoutNumberPrefix(Number(memberCount), 'member')}
            </span>
          </div>

          <div className="divider">
            <CWIcon iconName="dot" />
          </div>

          <div className="thread-data">
            <CWIcon iconName="notepad" />
            <span className="count">
              {Number(threadCount).toLocaleString('en-US')}
            </span>
            <span className="text">
              {pluralizeWithoutNumberPrefix(Number(threadCount), 'thread')}
            </span>
          </div>
        </div>

        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
};
