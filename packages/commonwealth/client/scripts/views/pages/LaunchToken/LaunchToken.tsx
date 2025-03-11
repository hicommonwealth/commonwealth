import { useFlag } from 'client/scripts/hooks/useFlag';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { MixpanelCommunityCreationEvent } from 'shared/analytics/types';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import './LaunchToken.scss';
import QuickTokenLaunchForm from './QuickTokenLaunchForm';

const LaunchToken = () => {
  const launchpadEnabled = useFlag('launchpad');
  const navigate = useCommonNavigate();

  const { isAddedToHomeScreen } = useAppStatus();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_VISITED,
      isPWA: isAddedToHomeScreen,
    },
  });

  if (!launchpadEnabled) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="LaunchToken">
        <QuickTokenLaunchForm
          onCancel={() => navigate('/')}
          onCommunityCreated={() => {}}
        />
      </div>
    </CWPageLayout>
  );
};

export default LaunchToken;
