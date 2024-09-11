import React from 'react';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import './LaunchToken.scss';
import useCreateCommunity from './useCreateCommunity';
import { CreateTokenCommunityStep, getFormSteps } from './utils';

const LaunchToken = () => {
  const { createTokenCommunityStep } = useCreateCommunity();

  const { isAddedToHomeScreen } = useAppStatus();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_VISITED,
      isPWA: isAddedToHomeScreen,
    },
  });

  const isSuccessStep =
    createTokenCommunityStep === CreateTokenCommunityStep.Success;

  const getCurrentStep = () => {
    switch (createTokenCommunityStep) {
      case CreateTokenCommunityStep.TokenInformation:
        // TODO: https://github.com/hicommonwealth/commonwealth/issues/8705
        return <>Not Implemented</>;
      case CreateTokenCommunityStep.CommunityInformation:
        // TODO: https://github.com/hicommonwealth/commonwealth/issues/8706
        return <>Not Implemented</>;
      case CreateTokenCommunityStep.SignatureLaunch:
        // TODO: https://github.com/hicommonwealth/commonwealth/issues/8707
        return <>Not Implemented</>;
    }
  };

  return (
    <CWPageLayout>
      <div className="LaunchToken">
        {!isSuccessStep && (
          <CWFormSteps steps={getFormSteps(createTokenCommunityStep)} />
        )}

        {getCurrentStep()}
      </div>
    </CWPageLayout>
  );
};

export default LaunchToken;
