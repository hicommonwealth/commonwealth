import { ChainBase, commonProtocol } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import AddressInfo from 'models/AddressInfo';
import React from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import useCreateCommunityMutation, {
  buildCreateCommunityInput,
} from 'state/api/communities/createCommunity';
import { fetchCachedNodes } from 'state/api/nodes';
import CommunityInformationForm from 'views/components/CommunityInformationForm/CommunityInformationForm';
import { CommunityInformationFormSubmitValues } from 'views/components/CommunityInformationForm/types';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { TokenInfo } from '../../types';
import './CommunityInformationStep.scss';
import { generateCommunityNameFromToken } from './utils';

interface CommunityInformationStepProps {
  handleGoBack: () => void;
  handleContinue: (communityId: string) => void;
  tokenInfo?: TokenInfo;
  selectedAddress?: AddressInfo;
}

const CommunityInformationStep = ({
  handleGoBack,
  handleContinue,
  tokenInfo,
  selectedAddress,
}: CommunityInformationStepProps) => {
  const { isAddedToHomeScreen } = useAppStatus();

  const initialValues = {
    communityName: generateCommunityNameFromToken({
      tokenName: tokenInfo?.name || '',
      tokenSymbol: tokenInfo?.symbol || '',
    }),
    communityDescription: tokenInfo?.description || '',
    communityProfileImageURL: tokenInfo?.imageURL || '',
  };

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
    // this condition will never be fulfilled but adding this to avoid typescript errors
    if (!selectedAddress) {
      notifyError('No address selected');
      return;
    }

    const nodes = fetchCachedNodes();
    const baseNode = nodes?.find(
      (n) => n.ethChainId === commonProtocol.ValidChains.SepoliaBase,
    );
    if (!baseNode || !baseNode.ethChainId) {
      notifyError('Could not find base chain node');
      return;
    }

    try {
      const input = buildCreateCommunityInput({
        id: values.communityId,
        name: values.communityName,
        chainBase: ChainBase.Ethereum,
        description: values.communityDescription,
        iconUrl: values.communityProfileImageURL,
        socialLinks: values.links ?? [],
        userAddress: selectedAddress.address,
        chainNodeId: baseNode.id,
        isPWA: isAddedToHomeScreen,
      });
      await createCommunityMutation(input);
      handleContinue(values.communityId);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleCancel = () => {
    trackAnalytics({
      event: MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_CANCELLED,
      isPWA: isAddedToHomeScreen,
    });

    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description:
        'Your details will not be saved. Cancel create token community flow?',
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

  return (
    <div className="CommunityInformationStep">
      <section className="header">
        <CWText type="h2">Tell us about your community</CWText>
        <CWText type="b1" className="description">
          Let&apos;s start with some basic information about your community
        </CWText>
      </section>

      <CWBanner
        type="info"
        body="Some information has been pre-filled by your token inputs. You can edit them now or later."
      />

      <CommunityInformationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isCreatingCommunity={createCommunityLoading}
        submitBtnLabel="Next"
        withSocialLinks={true}
        initialValues={initialValues}
      />
    </div>
  );
};

export default CommunityInformationStep;
