import type ChainInfo from 'client/scripts/models/ChainInfo';
import { CommunityData } from 'client/scripts/views/pages/DirectoryPage/DirectoryPageContent';
import { isCommandClick, pluralizeWithoutNumberPrefix } from 'helpers';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import app from 'state';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../../shared/analytics/types';
import { useCommunityStake } from '../../../CommunityStake';
import useJoinCommunity from '../../../SublayoutHeader/useJoinCommunity';
import { CWCommunityAvatar } from '../../cw_community_avatar';
import { CWIcon } from '../../cw_icons/cw_icon';
import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import { CWButton } from '../cw_button';
import './CWRelatedCommunityCard.scss';
import { addPeriodToText } from './utils';

type CWRelatedCommunityCardProps = {
  community: ChainInfo | CommunityData;
  memberCount: string;
  threadCount: string;
  stakeValue?: number;
  stakeChange?: number;
};

export const CWRelatedCommunityCard = ({
  community,
  memberCount,
  threadCount,
  stakeValue,
  stakeChange,
}: CWRelatedCommunityCardProps) => {
  const navigate = useCommonNavigate();
  const { stakeEnabled } = useCommunityStake({ communityId: community.id });

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      trackAnalytics({
        event: MixpanelClickthroughEvent.DIRECTORY_TO_COMMUNITY_PAGE,
      });
      if (isCommandClick(e)) {
        window.open(`/${community.id}`, '_blank');
        return;
      }
      navigateToCommunity({ navigate, path: '', chain: community.id });
    },
    [navigate, trackAnalytics, community.id],
  );

  const isCommunityMember =
    app.roles.getAllRolesInCommunity({ community: community.id }).length > 0;

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();

  return (
    <>
      <div
        className={ComponentType.RelatedCommunityCard}
        onClick={(e) => handleClick(e)}
      >
        <div className="content-container">
          <div className="top-content">
            <div className="community-info">
              <div className="header">
                <div className="community-name">
                  <CWCommunityAvatar
                    community={community as ChainInfo}
                    size="large"
                  />
                  <CWText type="h5" title={community.name} fontWeight="medium">
                    {community.name}
                  </CWText>
                </div>

                {stakeValue && (
                  <div className="stake-info">
                    <CWText type="h5" className="stake-value">
                      ${stakeValue}
                    </CWText>
                    <div>
                      <CWText type="caption" className="stake-change">
                        <span
                          className={`percentage ${
                            stakeChange >= 0 ? 'positive' : 'negative'
                          }`}
                        >
                          {stakeChange}%
                        </span>
                        <span className="hours">24h</span>
                      </CWText>
                    </div>
                  </div>
                )}
              </div>
              <div className="description">
                {community.description
                  ? addPeriodToText(community.description)
                  : null}
              </div>
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
          <div className="actions">
            <CWButton
              {...(isCommunityMember ? { iconLeft: 'checkCircleFilled' } : {})}
              buttonHeight="sm"
              buttonWidth="narrow"
              label={isCommunityMember ? 'Joined' : 'Join'}
              disabled={isCommunityMember}
              onClick={(e) => {
                e.stopPropagation();
                handleJoinCommunity();
              }}
            />

            {stakeEnabled && (
              <CWButton
                label="Buy Stake"
                buttonType="secondary"
                buttonAlt="green"
                buttonHeight="sm"
                buttonWidth="narrow"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            )}
          </div>
        </div>
      </div>
      {JoinCommunityModals}
    </>
  );
};
