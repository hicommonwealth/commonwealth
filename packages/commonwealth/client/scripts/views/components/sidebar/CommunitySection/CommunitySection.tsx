import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import NewProfile from 'client/scripts/models/NewProfile';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import { PageNotFound } from 'client/scripts/views/pages/404';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React, { useEffect, useState } from 'react';
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
import useManageCommunityStakeModalStore from '../../../../state/ui/modals/manageCommunityStakeModal';
import Permissions from '../../../../utils/Permissions';
import AccountConnectionIndicator from '../AccountConnectionIndicator';
import { AdminSection } from '../AdminSection';
import CreateCommunityButton from '../CreateCommunityButton';
import DirectoryMenuItem from '../DirectoryMenuItem';
import { DiscussionSection } from '../discussion_section';
import { ExternalLinksModule } from '../external_links_module';
import { GovernanceSection } from '../governance_section';
import './CommunitySection.scss';
import { CommunitySectionSkeleton } from './CommunitySectionSkeleton';
import ProfileCard from './ProfileCard';
import { TokenTradeWidget } from './TokenTradeWidget';

interface CommunitySectionProps {
  showSkeleton: boolean;
}

enum ProfileError {
  None,
  NoProfileFound,
}

export const CommunitySection = ({ showSkeleton }: CommunitySectionProps) => {
  const [profile, setProfile] = useState<NewProfile>();
  const [errorCode, setErrorCode] = useState<ProfileError>(ProfileError.None);

  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');
  const { setAuthModalType } = useAuthModalStore();

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

  const { data: domain } = useFetchCustomDomainQuery();

  const topicIdsIncludedInContest = getUniqueTopicIdsIncludedInActiveContest(
    contestsData.all,
  );

  const communityAlerts = useCommunityAlertsQuery({
    enabled: user.isLoggedIn && !!app.chain,
  }).data;

  const {
    data,
    isLoading: isLoadingProfile,
    error,
    refetch,
  } = useFetchProfileByIdQuery({
    apiCallEnabled: user.isLoggedIn,
    userId: user.id,
  });

  useEffect(() => {
    if (isLoadingProfile) return;

    if (error) {
      setErrorCode(ProfileError.NoProfileFound);
      setProfile(undefined);
      return;
    }

    if (data) {
      setProfile(
        new NewProfile({
          ...data.profile,
          userId: data.userId,
          isOwner: data.userId === user.id,
        }),
      );
      return;
    }
  }, [data, isLoadingProfile, error, user.id, communityId]);

  if (showSkeleton || isLoading || isContestDataLoading)
    return <CommunitySectionSkeleton />;

  if (errorCode === ProfileError.NoProfileFound)
    return <PageNotFound message="We cannot find this profile." />;

  const isAdmin =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  return (
    <>
      <div className="community-menu">
        {user.isLoggedIn && <ProfileCard />}
        {user.isLoggedIn && (
          <>
            <AccountConnectionIndicator
              connected={!!user.activeAccount}
              address={user.activeAccount?.address || ''}
              onAuthModalOpen={(modalType) =>
                setAuthModalType(modalType || AuthModalType.SignIn)
              }
              addresses={user.addresses.filter(
                (addr) => addr.community.id === communityId,
              )}
              profile={profile}
              refreshProfiles={() => {
                refetch().catch(console.error);
              }}
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

        {tokenizedCommunityEnabled && <TokenTradeWidget />}

        <CreateCommunityButton />

        {isAdmin && (
          <>
            <CWDivider />
            <AdminSection />
          </>
        )}

        <CWDivider />
        <DiscussionSection
          // @ts-expect-error <StrictNullChecks/>
          topicIdsIncludedInContest={topicIdsIncludedInContest}
        />
        <CWDivider />
        <GovernanceSection isContestAvailable={isContestAvailable} />
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
                window.open(`https://${PRODUCTION_DOMAIN}/`);
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
