import { TokenView } from '@hicommonwealth/schemas';
import 'components/sidebar/CommunitySection/CommunitySection.scss';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React from 'react';
import app from 'state';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import { useCommunityAlertsQuery } from 'state/api/trpc/subscription/useCommunityAlertsQuery';
import useUserStore from 'state/ui/user';
import {
  VoteWeightModule,
  useCommunityStake,
} from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { getUniqueTopicIdsIncludedInActiveContest } from 'views/components/sidebar/helpers';
import { SubscriptionButton } from 'views/components/subscription_button';
import ManageCommunityStakeModal from 'views/modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { z } from 'zod';
import useManageCommunityStakeModalStore from '../../../../state/ui/modals/manageCommunityStakeModal';
import Permissions from '../../../../utils/Permissions';
import AccountConnectionIndicator from '../AccountConnectionIndicator';
import { AdminSection } from '../AdminSection';
import CreateCommunityButton from '../CreateCommunityButton';
import DirectoryMenuItem from '../DirectoryMenuItem';
import { DiscussionSection } from '../discussion_section';
import { ExternalLinksModule } from '../external_links_module';
import { GovernanceSection } from '../governance_section';
import { CommunitySectionSkeleton } from './CommunitySectionSkeleton';
import { TokenTradeWidget } from './TokenTradeWidget';

interface CommunitySectionProps {
  showSkeleton: boolean;
}

export const CommunitySection = ({ showSkeleton }: CommunitySectionProps) => {
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const user = useUserStore();
  const {
    selectedAddress,
    modeOfManageCommunityStakeModal,
    setModeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();
  const {
    stakeEnabled,
    stakeBalance,
    currentVoteWeight,
    stakeValue,
    isLoading,
    activeChainId,
  } = useCommunityStake({
    // if user is not a community member but logged in, use an address that matches community chain base
    ...(selectedAddress &&
      !user.activeAccount && { walletAddress: selectedAddress }),
  });
  const { isContestAvailable, isContestDataLoading, contestsData } =
    useCommunityContests();

  // TODO: need api to get token per community;
  const communityToken = {
    token_address: '0xa40d9517de7e6536ccbbf6df45a1ad12fe2d040c',
    namespace: 'TikTokTulipMania',
    name: 'TikTokTulipMania',
    symbol: 'TTTMN',
    initial_supply: '1000000000000000000000000000',
    liquidity_transferred: false,
    launchpad_liquidity: '430000000000000000000000000',
    eth_market_cap_target: 29.447347142468825,
    icon_url:
      'https://s3.amazonaws.com/local.assets/de0e4788-8abe-436b-84cc-7f83a2f6cb5f.png',
    // eslint-disable-next-line max-len
    description: `TikTokTulipMania: Because nothing says "investment" like fleeting trends and historical economic collapses. Dive in, it's only pixels! 🌷💸`,
    created_at: '2024-11-18T19:28:15.103Z',
    updated_at: '2024-11-18T19:28:15.103Z',
    community_id: 'tiktoktulipmania-tttmn-community',
  } as unknown as z.infer<typeof TokenView>;
  const isLoadingToken = false;

  const { data: domain } = useFetchCustomDomainQuery();

  const topicIdsIncludedInContest = getUniqueTopicIdsIncludedInActiveContest(
    contestsData.all,
  );

  const communityAlerts = useCommunityAlertsQuery({
    enabled: user.isLoggedIn && !!app.chain,
  }).data;

  if (showSkeleton || isLoading || isContestDataLoading)
    return <CommunitySectionSkeleton />;

  const isAdmin =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  return (
    <>
      <div className="community-menu">
        {user.isLoggedIn && (
          <>
            <AccountConnectionIndicator
              connected={!!user.activeAccount}
              address={user.activeAccount?.address || ''}
            />

            {stakeEnabled && (
              <VoteWeightModule
                voteWeight={currentVoteWeight?.toString() || '0'}
                stakeNumber={stakeBalance}
                stakeValue={stakeValue}
                denomination={findDenominationString(activeChainId) || 'ETH'}
                onOpenStakeModal={setModeOfManageCommunityStakeModal}
              />
            )}
          </>
        )}

        {tokenizedCommunityEnabled && communityToken && (
          <TokenTradeWidget
            showSkeleton={isLoadingToken}
            token={communityToken}
          />
        )}

        <CreateCommunityButton />

        {isAdmin && (
          <>
            <CWDivider />
            <AdminSection />
          </>
        )}

        <CWDivider />
        <DiscussionSection
          isContestAvailable={stakeEnabled && isContestAvailable}
          // @ts-expect-error <StrictNullChecks/>
          topicIdsIncludedInContest={topicIdsIncludedInContest}
        />
        <CWDivider />
        <GovernanceSection />
        <CWDivider />
        <DirectoryMenuItem />
        <CWDivider />

        <ExternalLinksModule />
        <div className="buttons-container">
          {user.isLoggedIn && app.chain && (
            <div className="subscription-button">
              <SubscriptionButton communityAlerts={communityAlerts} />
            </div>
          )}
          {domain?.isCustomDomain && (
            <div
              className="powered-by"
              onClick={() => {
                window.open('https://commonwealth.im/');
              }}
            />
          )}
        </div>
      </div>
      <CWModal
        size="small"
        content={
          <ManageCommunityStakeModal
            mode={modeOfManageCommunityStakeModal}
            // @ts-expect-error <StrictNullChecks/>
            onModalClose={() => setModeOfManageCommunityStakeModal(null)}
            denomination={findDenominationString(activeChainId) || 'ETH'}
          />
        }
        // @ts-expect-error <StrictNullChecks/>
        onClose={() => setModeOfManageCommunityStakeModal(null)}
        open={!!modeOfManageCommunityStakeModal}
      />
    </>
  );
};
