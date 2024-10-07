import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import './LaunchToken.scss';
import CommunityInformationStep from './steps/CommunityInformationStep';
import SignatureStep from './steps/SignatureStep';
import SuccessStep from './steps/SuccessStep';
import TokenInformationStep from './steps/TokenInformationStep';
import useCreateCommunity from './useCreateCommunity';
import { CreateTokenCommunityStep, getFormSteps } from './utils';

const LaunchToken = () => {
  const navigate = useCommonNavigate();
  const {
    baseNode,
    createTokenCommunityStep,
    onChangeStep,
    draftTokenInfo,
    selectedAddress,
    setSelectedAddress,
    setDraftTokenInfo,
    createdCommunityId,
    setCreatedCommunityId,
    isTokenLaunched,
    setIsTokenLaunched,
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
              setDraftTokenInfo({
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
            handleContinue={(communityId) => {
              setCreatedCommunityId(communityId);

              onChangeStep(true);
            }}
            tokenInfo={draftTokenInfo}
            selectedAddress={selectedAddress}
          />
        );
      case CreateTokenCommunityStep.SignatureLaunch:
        // this condition will never be triggered, adding this to avoid typescript errors
        if (!createdCommunityId || !selectedAddress || !draftTokenInfo)
          return <></>;

        return (
          <SignatureStep
            createdCommunityId={createdCommunityId}
            baseNode={baseNode}
            tokenInfo={draftTokenInfo}
            goToSuccessStep={(isLaunched) => {
              setIsTokenLaunched(isLaunched);

              onChangeStep(true);
            }}
            selectedAddress={selectedAddress}
          />
        );
      case CreateTokenCommunityStep.Success:
        // this condition will never be triggered, adding this to avoid typescript errors
        if (!createdCommunityId) return <></>;

        return (
          <SuccessStep
            communityId={createdCommunityId}
            withToken={isTokenLaunched}
          />
        );
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
