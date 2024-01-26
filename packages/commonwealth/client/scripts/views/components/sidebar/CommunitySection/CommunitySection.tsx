import 'components/sidebar/CommunitySection/CommunitySection.scss';
import { featureFlags } from 'helpers/feature-flags';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import {
  VoteWeightModule,
  useCommunityStake,
} from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { SubscriptionButton } from 'views/components/subscription_button';
import ManageCommunityStakeModal from 'views/modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
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
import { AdminSection as OldAdminSection } from '../old_admin_section';
import { CommunitySectionSkeleton } from './CommunitySectionSkeleton';

interface CommunitySectionProps {
  showSkeleton: boolean;
}

export const CommunitySection = ({ showSkeleton }: CommunitySectionProps) => {
  const [typeOfManageCommunityStakeModal, setTypeOfManageCommunityStakeModal] =
    useState<ManageCommunityStakeModalMode>(null);

  const navigate = useCommonNavigate();
  const { pathname } = useLocation();
  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount } = useUserActiveAccount();
  const { stakeEnabled } = useCommunityStake();

  if (showSkeleton) return <CommunitySectionSkeleton />;

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

            {stakeEnabled && (
              <VoteWeightModule
                voteWeight={1}
                stakeNumber={1}
                stakeValue={3}
                denomination="eth"
              />
            )}
          </>
        )}

        <CreateCommunityButton />

        {showAdmin && (
          <>
            <CWDivider />
            {featureFlags.newAdminOnboardingEnabled ? (
              <AdminSection />
            ) : (
              <OldAdminSection />
            )}
          </>
        )}
        {featureFlags.communityHomepage && app.chain?.meta.hasHomepage && (
          <div
            className={onHomeRoute ? 'home-button active' : 'home-button'}
            onClick={() => navigate('/feed')}
          >
            <CWIcon iconName="home" iconSize="small" />
            <CWText>Home</CWText>
          </div>
        )}

        <CWDivider />
        <DiscussionSection />
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
        visibleOverflow
        content={
          <ManageCommunityStakeModal
            mode={typeOfManageCommunityStakeModal}
            onModalClose={() => setTypeOfManageCommunityStakeModal(null)}
          />
        }
        onClose={() => setTypeOfManageCommunityStakeModal(null)}
        open={!!typeOfManageCommunityStakeModal}
      />
    </>
  );
};
