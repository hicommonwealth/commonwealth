import clsx from 'clsx';
import { isCommandClick, pluralizeWithoutNumberPrefix } from 'helpers';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import type ChainInfo from 'models/ChainInfo';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { CommunityData } from 'views/pages/DirectoryPage/DirectoryPageContent';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../../shared/analytics/types';
import { useCommunityCardPrice } from '../../../../../hooks/useCommunityCardPrice';
import { CWCommunityAvatar } from '../../cw_community_avatar';
import { CWIcon } from '../../cw_icons/cw_icon';
import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import { CWTooltip } from '../CWTooltip';
import { CWButton } from '../cw_button';
import './CWRelatedCommunityCard.scss';
import { addPeriodToText } from './utils';

type CWRelatedCommunityCardProps = {
  community: ChainInfo | CommunityData;
  memberCount: string | number;
  threadCount: string | number;
  onStakeBtnClick?: () => void;
  ethUsdRate?: string;
  historicalPrice?: string;
};

export const CWRelatedCommunityCard = ({
  community,
  memberCount,
  threadCount,
  onStakeBtnClick,
  ethUsdRate,
  historicalPrice,
}: CWRelatedCommunityCardProps) => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  const { stakeEnabled, stakeValue, stakeChange } = useCommunityCardPrice({
    community: community as ChainInfo,
    ethUsdRate,
    stakeId: 2,
    historicalPrice,
  });

  console.log(stakeValue, stakeChange);

  const { setModeOfManageCommunityStakeModal, setSelectedCommunity } =
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

  const handleBuyStakeClick = () => {
    onStakeBtnClick?.();
    setModeOfManageCommunityStakeModal('buy');
    setSelectedCommunity(community);
  };

  const stakeButton = (
    <CWButton
      label="Buy Stake"
      buttonType="secondary"
      buttonAlt="green"
      buttonHeight="sm"
      buttonWidth="narrow"
      disabled={!isLoggedIn}
      onClick={(e) => {
        e.stopPropagation();
        handleBuyStakeClick();
      }}
    />
  );

  return (
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

              {!!stakeValue && (
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
                      {stakeChange.toFixed(2)}%
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
        {stakeEnabled && (
          <div className="actions">
            {!isLoggedIn ? (
              <CWTooltip
                placement="right"
                content="Login to buy stakes"
                renderTrigger={(handleInteraction) => (
                  <span
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  >
                    {stakeButton}
                  </span>
                )}
              />
            ) : (
              stakeButton
            )}
          </div>
        )}
      </div>
    </div>
  );
};
