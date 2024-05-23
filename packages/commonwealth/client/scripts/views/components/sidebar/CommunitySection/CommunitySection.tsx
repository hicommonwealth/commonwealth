import 'components/sidebar/CommunitySection/CommunitySection.scss';
import { findDenominationString } from 'helpers/findDenomination';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import {
  VoteWeightModule,
  useCommunityStake,
} from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { getUniqueTopicIdsIncludedInContest } from 'views/components/sidebar/helpers';
import { SubscriptionButton } from 'views/components/subscription_button';
import ManageCommunityStakeModal from 'views/modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { useFlag } from '../../../../hooks/useFlag';
import useManageCommunityStakeModalStore from '../../../../state/ui/modals/manageCommunityStakeModal';
import Permissions from '../../../../utils/Permissions';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
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
  const communityHomepageEnabled = useFlag('communityHomepage');
  const communityStakeEnabled = useFlag('communityStake');
  const navigate = useCommonNavigate();
  const { pathname } = useLocation();
  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount } = useUserActiveAccount();
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
      !app?.user?.activeAccount && { walletAddress: selectedAddress }),
  });
  const { isContestAvailable, isContestDataLoading, contestsData } =
    useCommunityContests();

  const topicIdsIncludedInContest =
    getUniqueTopicIdsIncludedInContest(contestsData);

  if (showSkeleton || isLoading || isContestDataLoading)
    return <CommunitySectionSkeleton />;

  const onHomeRoute = pathname === `/${app.activeChainId()}/feed`;
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isMod = Permissions.isCommunityModerator();
  const showAdmin = app.user && (isAdmin || isMod);

  return (
    <>
      <div className="community-menu">
        {app.isLoggedIn() && (
          <>
            <AccountConnectionIndicator
              connected={!!activeAccount}
              address={activeAccount?.address}
            />

            {communityStakeEnabled && stakeEnabled && (
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
        {communityHomepageEnabled && app.chain?.meta.hasHomepage && (
          <div
            className={onHomeRoute ? 'home-button active' : 'home-button'}
            onClick={() => navigate('/feed')}
          >
            <CWIcon iconName="home" iconSize="small" />
            <CWText>Home</CWText>
          </div>
        )}

        <CWDivider />
        <DiscussionSection
          isContestAvailable={stakeEnabled && isContestAvailable}
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
            onModalClose={() => setModeOfManageCommunityStakeModal(null)}
            denomination={findDenominationString(activeChainId) || 'ETH'}
            {...(selectedCommunity && { community: selectedCommunity })}
          />
        }
        onClose={() => setModeOfManageCommunityStakeModal(null)}
        open={!!modeOfManageCommunityStakeModal}
      />
    </>
  );
};
