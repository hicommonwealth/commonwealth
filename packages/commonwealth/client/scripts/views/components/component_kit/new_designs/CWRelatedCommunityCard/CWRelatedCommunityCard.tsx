import { notifyError } from 'client/scripts/controllers/app/notifications';
import type ChainInfo from 'client/scripts/models/ChainInfo';
import { useManageCommunityStakeModalStore } from 'client/scripts/state/ui/modals';
import { CommunityData } from 'client/scripts/views/pages/DirectoryPage/DirectoryPageContent';
import clsx from 'clsx';
import { isCommandClick, pluralizeWithoutNumberPrefix } from 'helpers';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import Permissions from 'utils/Permissions';
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
  memberCount: string | number;
  threadCount: string | number;
  stakeChange?: number;
  onStakeBtnClick?: () => any;
};

export const CWRelatedCommunityCard = ({
  community,
  memberCount,
  threadCount,
  stakeChange,
  onStakeBtnClick,
}: CWRelatedCommunityCardProps) => {
  const navigate = useCommonNavigate();
  const { stakeEnabled, stakeValue } = useCommunityStake({
    community: community,
  });
  const [hasJoinedCommunity, setHasJoinedCommunity] = useState(false);

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity({
    communityToJoin: community.id,
    onJoin: setHasJoinedCommunity,
  });

  const isCommunityMember = Permissions.isCommunityMember(community.id);

  const { setModeOfManageCommunityStakeModal } =
    useManageCommunityStakeModalStore();

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelClickthroughPayload>({
      onAction: true,
    });

  const handleCommunityClick = useCallback(
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

  const handleBuyStakeClick = async () => {
    onStakeBtnClick?.();
    if (!isCommunityMember && !hasJoinedCommunity) {
      const joined = await handleJoinCommunity();

      if (joined) {
        setModeOfManageCommunityStakeModal('buy');
      }
    } else {
      setModeOfManageCommunityStakeModal('buy');
    }
  };

  return (
    <>
      <div
        className={ComponentType.RelatedCommunityCard}
        onClick={(e) => handleCommunityClick(e)}
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

                {!isNaN(stakeValue) && stakeChange && (
                  <div className="stake-info">
                    <CWText type="h5" className="stake-value">
                      ${stakeValue}
                    </CWText>
                    <CWText type="caption" className="stake-change">
                      <CWText
                        className={clsx(
                          `percentage`,
                          stakeChange >= 0 ? 'positive' : 'negative',
                        )}
                      >
                        {stakeChange}%
                      </CWText>
                      <CWText className="hours">24h</CWText>
                    </CWText>
                  </div>
                )}
              </div>
              {community.description && (
                <CWText className="description" type="b2">
                  {addPeriodToText(community.description)}
                </CWText>
              )}
            </div>
          </div>
          <div className="metadata">
            <div className="member-data">
              <CWIcon iconName="users" iconSize="small" />
              <CWText className="count" type="caption">
                {Number(memberCount).toLocaleString('en-US')}
              </CWText>

              <CWText className="text" type="caption">
                {pluralizeWithoutNumberPrefix(Number(memberCount), 'member')}
              </CWText>
            </div>

            <div className="divider">
              <CWIcon iconName="dot" />
            </div>

            <div className="thread-data">
              <CWIcon iconName="notepad" />
              <CWText className="count" type="caption">
                {threadCount.toLocaleString('en-US')}
              </CWText>
              <CWText className="text" type="caption">
                {pluralizeWithoutNumberPrefix(Number(threadCount), 'thread')}
              </CWText>
            </div>
          </div>
          <div className="actions">
            <CWButton
              {...(isCommunityMember || hasJoinedCommunity
                ? { iconLeft: 'checkCircleFilled' }
                : {})}
              buttonHeight="sm"
              buttonWidth="narrow"
              label={
                isCommunityMember || hasJoinedCommunity ? 'Joined' : 'Join'
              }
              disabled={isCommunityMember || hasJoinedCommunity}
              onClick={(e) => {
                e.stopPropagation();
                handleJoinCommunity().catch(() =>
                  notifyError(`Could not join ${community.name}`),
                );
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
                  handleBuyStakeClick();
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
