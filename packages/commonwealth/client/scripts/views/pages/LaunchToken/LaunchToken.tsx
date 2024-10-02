import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import './LaunchToken.scss';
import CommunityInformationStep from './steps/CommunityInformationStep';
import TokenInformationStep from './steps/TokenInformationStep';
import useCreateCommunity from './useCreateCommunity';
import { CreateTokenCommunityStep, getFormSteps } from './utils';

const LaunchToken = () => {
  const navigate = useCommonNavigate();
  const {
    createTokenCommunityStep,
    onChangeStep,
    createdTokenInfo,
    selectedAddress,
    setSelectedAddress,
    setCreatedTokenInfo,
  } = useCreateCommunity();

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
        return (
          <TokenInformationStep
            handleGoBack={() => navigate('/')} // redirect to home
            handleContinue={(tokenInfo) => {
              setCreatedTokenInfo({
                name: tokenInfo.tokenName,
                symbol: tokenInfo.tokenTicker,
                description: tokenInfo.tokenDescription,
                imageURL: tokenInfo.tokenImageURL,
              });

              onChangeStep(true);
            }}
            onAddressSelected={(address) => setSelectedAddress(address)}
            selectedAddress={selectedAddress}
          />
        );
      case CreateTokenCommunityStep.CommunityInformation:
        return (
          <CommunityInformationStep
            handleGoBack={() => onChangeStep(false)}
            handleContinue={() => onChangeStep(true)}
            tokenInfo={createdTokenInfo}
          />
        );
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
