import { notifyError } from 'controllers/app/notifications';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import useCreateCommunityMutation, {
  buildCreateCommunityInput,
} from 'state/api/communities/createCommunity';
import CommunityInformationForm from 'views/components/CommunityInformationForm/CommunityInformationForm';
import { useTurnstile } from 'views/components/useTurnstile';
// eslint-disable-next-line max-len
import { alphabeticallyStakeWiseSortedChains as sortedChains } from 'views/components/CommunityInformationForm/constants';
import { CommunityInformationFormSubmitValues } from 'views/components/CommunityInformationForm/types';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { openConfirmation } from 'views/modals/confirmation_modal';
import './CommunityInformationStep.scss';

interface CommunityInformationStepProps {
  selectedCommunity: SelectedCommunity;
  handleGoBack: () => void;
  handleContinue: (communityId: string, communityName: string) => void;
  handleSelectedChainId: (chainId: string) => void;
}

const CommunityInformationStep = ({
  selectedCommunity,
  handleGoBack,
  handleContinue,
  handleSelectedChainId,
}: CommunityInformationStepProps) => {
  const { isAddedToHomeScreen } = useAppStatus();

  const {
    turnstileToken,
    isTurnstileEnabled,
    TurnstileWidget,
    resetTurnstile,
  } = useTurnstile({
    action: 'create-community',
  });

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const {
    mutateAsync: createCommunityMutation,
    isLoading: createCommunityLoading,
  } = useCreateCommunityMutation();

  const handleSubmit = async (
    values: CommunityInformationFormSubmitValues & { communityId: string },
  ) => {
    // Simplified logic: Find the chain node by comparing stringified values.
    // This works for Sui chains (e.g., "sui-123") and other chains (e.g., "1", "osmosis")
    // because values.chain.value from the form now directly matches chain.value in sortedChains.
    const selectedChainNode = sortedChains.find(
      (chain) => String(chain.value) === String(values?.chain?.value),
    );

    if (isTurnstileEnabled && !turnstileToken) {
      notifyError('Please complete the verification');
      return;
    }

    try {
      const input = buildCreateCommunityInput({
        id: values.communityId,
        name: values.communityName,
        chainBase: selectedCommunity.chainBase,
        description: values.communityDescription,
        iconUrl: values.communityProfileImageURL,
        socialLinks: values.links ?? [],
        chainNodeId: selectedChainNode!.id!,
        turnstileToken: turnstileToken || undefined,
        tokenizeCommunity: values.tokenizeCommunity,
      });
      await createCommunityMutation(input);
      handleContinue(values.communityId, values.communityName);
    } catch (err) {
      notifyError(err.message);
      // Reset turnstile if there's an error
      if (isTurnstileEnabled) {
        resetTurnstile();
      }
    }
  };

  const handleCancel = () => {
    trackAnalytics({
      event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_CANCELLED,
      isPWA: isAddedToHomeScreen,
    });

    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description: 'Your details will not be saved. Cancel create community?',
      buttons: [
        {
          label: 'Yes, cancel',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: handleGoBack,
        },
        {
          label: 'No, continue',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const handleWatchForm = (values: CommunityInformationFormSubmitValues) => {
    // Extract the chain ID value, handling the Sui special case
    if (values?.chain?.value) {
      if (values.chain.value.toString().startsWith('sui-')) {
        // For Sui chains, pass the node ID directly
        const chainNodeId = values.chain.value.split('-')[1];
        handleSelectedChainId(chainNodeId);
      } else {
        // For regular chains, pass the value as before
        handleSelectedChainId(values.chain.value);
      }
    }
  };

  return (
    <div className="CommunityInformationStep">
      <section className="header">
        <CWText type="h2">Tell us about your community</CWText>
        <CWText type="b1" className="description">
          Let&apos;s start with some Community information about your community
        </CWText>
      </section>

      <FeatureHint
        title="Chain selection cannot be changed"
        hint={`
              Choose the chain your project is built on. You can choose between Solana, Ethereum,
               or Cosmos based chains. Chain selection 
              determines availability of features such as Contests, Stakes, and Weighted Voting.
            `}
      />

      <CommunityInformationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onWatch={handleWatchForm}
        withChainsConfig={{ community: selectedCommunity }}
        withSocialLinks={false} // TODO: Set this when design figures out how we will integrate the social links
        isCreatingCommunity={createCommunityLoading}
        submitBtnLabel="Launch Community"
        isTurnstileEnabled={isTurnstileEnabled}
        turnstileToken={turnstileToken}
        TurnstileWidget={isTurnstileEnabled ? TurnstileWidget : undefined}
      />
    </div>
  );
};

export default CommunityInformationStep;
