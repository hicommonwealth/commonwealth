import 'components/sidebar/CommunitySection/CommunitySection.scss';
import { findDenominationString } from 'helpers/findDenomination';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React from 'react';
import app from 'state';
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

interface CommunitySectionProps {
  showSkeleton: boolean;
}

export const CommunitySection = ({ showSkeleton }: CommunitySectionProps) => {
  const { isLoggedIn } = useUserLoggedIn();
  const user = useUserStore();
  const {
    selectedAddress,
    selectedCommunity,
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

  const topicIdsIncludedInContest =
    getUniqueTopicIdsIncludedInActiveContest(contestsData);

  if (showSkeleton || isLoading || isContestDataLoading)
    return <CommunitySectionSkeleton />;

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isMod = Permissions.isCommunityModerator();
  const showAdmin = isAdmin || isMod;

  return (
    <>
      <div className="community-menu">
        {app.isLoggedIn() && (
          <>
            <AccountConnectionIndicator
              connected={!!user.activeAccount}
              address={user.activeAccount?.address || ''}
            />

            {stakeEnabled && (
              <VoteWeightModule
                voteWeight={currentVoteWeight}
                stakeNumber={stakeBalance}
                stakeValue={stakeValue}
                denomination={findDenominationString(activeChainId) || 'ETH'}
                onOpenStakeModal={setModeOfManageCommunityStakeModal}
              />
            )}
          </>
        )}

        <CreateCommunityButton />

        {showAdmin && (
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
          {isLoggedIn && app.chain && (
            <div className="subscription-button">
              <SubscriptionButton />
            </div>
          )}
          {app.isCustomDomain() && (
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
            {...(selectedCommunity && { community: selectedCommunity })}
          />
        }
        // @ts-expect-error <StrictNullChecks/>
        onClose={() => setModeOfManageCommunityStakeModal(null)}
        open={!!modeOfManageCommunityStakeModal}
      />
    </>
  );
};
