import { ExtendedCommunity } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { isCommandClick, pluralizeWithoutNumberPrefix } from 'helpers';
import { disabledStakeButtonTooltipText } from 'helpers/tooltipTexts';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { z } from 'zod';
import {
  MixpanelClickthroughEvent,
  MixpanelClickthroughPayload,
} from '../../../../../../../shared/analytics/types';
import useAppStatus from '../../../../../hooks/useAppStatus';
import { useCommunityCardPrice } from '../../../../../hooks/useCommunityCardPrice';
import { CWCommunityAvatar } from '../../cw_community_avatar';
import { CWIcon } from '../../cw_icons/cw_icon';
import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import { CWButton } from '../CWButton';
import { CWTooltip } from '../CWTooltip';
import './CWRelatedCommunityCard.scss';
import { addPeriodToText } from './utils';

type CWRelatedCommunityCardProps = {
  community: z.infer<typeof ExtendedCommunity>;
  memberCount: string | number;
  threadCount: string | number;
  canBuyStake?: boolean;
  onStakeBtnClick?: () => void;
  ethUsdRate?: string;
  historicalPrice?: string;
  onlyShowIfStakeEnabled?: boolean;
};

export const CWRelatedCommunityCard = ({
  community,
  memberCount,
  threadCount,
  canBuyStake,
  onStakeBtnClick,
  ethUsdRate,
  historicalPrice,
  onlyShowIfStakeEnabled,
}: CWRelatedCommunityCardProps) => {
  const navigate = useCommonNavigate();
  const { isAddedToHomeScreen } = useAppStatus();
  const user = useUserStore();

  const { stakeEnabled, stakeValue, stakeChange } = useCommunityCardPrice({
    community,
    // @ts-expect-error <StrictNullChecks/>
    ethUsdRate,
    stakeId: 2,
    // @ts-expect-error <StrictNullChecks/>
    historicalPrice,
  });

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
        isPWA: isAddedToHomeScreen,
      });

      if (!community?.id) return;

      if (isCommandClick(e)) {
        window.open(`/${community?.id}`, '_blank');
        return;
      }
      navigateToCommunity({ navigate, path: '', chain: community?.id });
    },
    [navigate, trackAnalytics, community?.id, isAddedToHomeScreen],
  );

  const handleBuyStakeClick = () => {
    onStakeBtnClick?.();
    setModeOfManageCommunityStakeModal('buy');
    if (community?.id && community?.namespace && community?.ChainNode) {
      setSelectedCommunity({
        id: community?.id,
        name: community?.name,
        base: community?.base,
        namespace: community?.namespace,
        iconUrl: community?.icon_url || '',
        ChainNode: {
          url: community?.ChainNode?.url || '',
          ethChainId: community?.ChainNode?.eth_chain_id || 0,
        },
      });
    }
  };

  const disableStakeButton = !user.isLoggedIn || !canBuyStake;

  const stakeButton = (
    <CWButton
      label="Buy Stake"
      buttonType="secondary"
      buttonAlt="green"
      buttonHeight="sm"
      buttonWidth="narrow"
      disabled={disableStakeButton}
      onClick={(e) => {
        e.stopPropagation();
        handleBuyStakeClick();
      }}
    />
  );

  if (onlyShowIfStakeEnabled && !stakeEnabled) return <></>;

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
                  community={{
                    iconUrl: community?.icon_url || '',
                    name: community?.name,
                  }}
                  size="large"
                />
                <CWText type="h5" title={community?.name} fontWeight="medium">
                  {community?.name}
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
            {community?.description && (
              <CWText className="description" type="b2">
                {addPeriodToText(community?.description)}
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
            {disableStakeButton ? (
              <CWTooltip
                placement="right"
                content={disabledStakeButtonTooltipText({
                  isLoggedIn: user.isLoggedIn,
                  connectBaseChainToBuy: community?.base,
                })}
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
