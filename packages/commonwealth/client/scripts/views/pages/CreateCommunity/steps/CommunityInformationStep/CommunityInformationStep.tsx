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
    const selectedChainNode = sortedChains.find(
      (chain) => String(chain.value) === values?.chain?.value,
    );

    try {
      const input = buildCreateCommunityInput({
        id: values.communityId,
        name: values.communityName,
        chainBase: selectedCommunity.chainBase,
        description: values.communityDescription,
        iconUrl: values.communityProfileImageURL,
        socialLinks: values.links ?? [],
        chainNodeId: selectedChainNode!.id!,
      });
      await createCommunityMutation(input);
      handleContinue(values.communityId, values.communityName);
    } catch (err) {
      notifyError(err.message);
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
    values?.chain?.value && handleSelectedChainId(values.chain.value);
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
        title="Selecting your chain"
        hint="Choose the chain that your Ethereum project is built on.
        If you’re not sure what to choose you can select the Ethereum Mainnet."
      />

      <CommunityInformationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onWatch={handleWatchForm}
        withChainsConfig={{ community: selectedCommunity }}
        withSocialLinks={false} // TODO: Set this when design figures out how we will integrate the social links
        isCreatingCommunity={createCommunityLoading}
        submitBtnLabel="Launch Community"
      />
    </div>
  );
};

export default CommunityInformationStep;
