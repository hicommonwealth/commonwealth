import 'components/sidebar/CommunitySection/CommunitySection.scss';
import { featureFlags } from 'helpers/feature-flags';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { SubscriptionButton } from 'views/components/subscription_button';
import Permissions from '../../../../utils/Permissions';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import AccountConnectionIndicator from '../AccountConnectionIndicator';
import CreateCommunityButton from '../CreateCommunityButton';
import DirectoryMenuItem from '../DirectoryMenuItem';
import { AdminSection } from '../admin_section';
import { DiscussionSection } from '../discussion_section';
import { ExternalLinksModule } from '../external_links_module';
import { GovernanceSection } from '../governance_section';
import { CommunitySectionSkeleton } from './CommunitySectionSkeleton';

interface CommunitySectionProps {
  showSkeleton: boolean;
}
export const CommunitySection = ({ showSkeleton }: CommunitySectionProps) => {
  const navigate = useCommonNavigate();
  const { pathname } = useLocation();
  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount } = useUserActiveAccount();

  if (showSkeleton) return <CommunitySectionSkeleton />;

  const onHomeRoute = pathname === `/${app.activeChainId()}/feed`;
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isMod = Permissions.isCommunityModerator();
  const showAdmin = app.user && (isAdmin || isMod);

  return (
    <div className="community-menu">
      {app.isLoggedIn() && (
        <AccountConnectionIndicator
          connected={!!activeAccount}
          address={activeAccount?.address}
        />
      )}

      <CreateCommunityButton />

      {showAdmin && (
        <>
          <CWDivider />
          <AdminSection />
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
  );
};
