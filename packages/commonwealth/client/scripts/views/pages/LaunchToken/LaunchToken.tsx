import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import './LaunchToken.scss';
import QuickTokenLaunchForm from './QuickTokenLaunchForm';

const LaunchToken = () => {
  const navigate = useCommonNavigate();

  const { isAddedToHomeScreen } = useAppStatus();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_VISITED,
      isPWA: isAddedToHomeScreen,
    },
  });

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
