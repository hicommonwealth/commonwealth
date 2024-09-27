import { ChainBase, commonProtocol } from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import { useLaunchTokenMutation } from 'state/api/launchPad';
import { fetchCachedNodes } from 'state/api/nodes';
import useUserStore from 'state/ui/user';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/cw_cover_image_uploader';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCommunitySelector, {
  CommunityType,
} from 'views/components/component_kit/new_designs/CWCommunitySelector';
import {
  CWForm,
  CWFormRef,
} from 'views/components/component_kit/new_designs/CWForm';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { AuthModal } from 'views/modals/AuthModal';
import NewCommunityAdminModal from 'views/modals/NewCommunityAdminModal';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { communityTypeOptions } from 'views/pages/CreateCommunity/steps/CommunityTypeStep/helpers';
import './TokenInformationForm.scss';
import { FormSubmitValues, TokenInformationFormProps } from './types';
import { tokenInformationFormValidationSchema } from './validation';

const TokenInformationForm = ({
  onSubmit,
  onCancel,
  onAddressSelected,
  selectedAddress,
}: TokenInformationFormProps) => {
  const user = useUserStore();
  const [baseOption] = communityTypeOptions;

  const shouldSubmitOnAddressSelection = useRef(false);
  const formMethodsRef = useRef<CWFormRef>();
  const [
    isNewTokenCommunityAdminModalOpen,
    setIsNewTokenCommunityAdminModalOpen,
  ] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const { mutateAsync: launchToken } = useLaunchTokenMutation();

  const openAddressSelectionModal = useCallback(() => {
    if (selectedAddress) {
      setIsAuthModalOpen(false);
      setIsNewTokenCommunityAdminModalOpen(false);
    } else {
      setIsAuthModalOpen(!user.isLoggedIn);
      setIsNewTokenCommunityAdminModalOpen(user.isLoggedIn);
    }
  }, [selectedAddress, user.isLoggedIn]);

  useRunOnceOnCondition({
    callback: openAddressSelectionModal,
    shouldRun: true,
  });

  const handleSubmit = useCallback(
    async (values: FormSubmitValues) => {
      // get address from user
      if (!selectedAddress) {
        openAddressSelectionModal();
        shouldSubmitOnAddressSelection.current = true;
        return;
      }

      // get base chain node info
      const nodes = fetchCachedNodes();
      const baseNode = nodes?.find(
        (n) => n.ethChainId === commonProtocol.ValidChains.Base,
      );
      if (!baseNode || !baseNode.ethChainId) {
        notifyError('Could not find base chain node');
        return;
      }

      // call endpoint
      const payload = {
        chainRpc: baseNode.url,
        ethChainId: baseNode.ethChainId,
        name: values.tokenName.trim(),
        symbol: values.tokenTicker.trim(),
        walletAddress: selectedAddress.address,
        // TODO 9207: where to store values.tokenDescription and values.tokenImageURL
      };
      await launchToken(payload).catch(console.error);

      onSubmit(values);
    },
    [openAddressSelectionModal, selectedAddress, onSubmit, launchToken],
  );

  useEffect(() => {
    if (shouldSubmitOnAddressSelection.current) {
      formMethodsRef.current &&
        formMethodsRef.current
          .handleSubmit(handleSubmit)()
          .catch(console.error);
      shouldSubmitOnAddressSelection.current = false;
    }
  }, [selectedAddress, handleSubmit]);

  const handleCancel = () => {
    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description: 'Your details will not be saved. Cancel create token flow?',
      buttons: [
        {
          label: 'Yes, cancel',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            trackAnalytics({
              event:
                MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_CANCELLED,
              isPWA: isAddedToHomeScreen,
            });

            onCancel();
          },
        },
        {
          label: 'No, continue',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const handleClickConnectNewWallet = () => {
    setIsAuthModalOpen(true);
    setIsNewTokenCommunityAdminModalOpen(false);
  };

  const handleSelectedAddress = (address: string) => {
    const pickedAddressInfo = user.addresses.find(
      ({ addressId }) => String(addressId) === address,
    );
    pickedAddressInfo && onAddressSelected(pickedAddressInfo);

    setIsNewTokenCommunityAdminModalOpen(false);
  };

  return (
    <CWForm
      // @ts-expect-error <StrictNullChecks/>
      ref={formMethodsRef}
      validationSchema={tokenInformationFormValidationSchema}
      onSubmit={handleSubmit}
      className="TokenInformationForm"
    >
      <div>
        <CWLabel label="Launching On" />
        <CWCommunitySelector
          key={baseOption.type}
          img={baseOption.img}
          title={baseOption.title}
          onClick={() => {}}
          withRadioButton={{
            value: baseOption.chainBase,
            checked: true,
            hideLabels: true,
            hookToForm: true,
            name: 'tokenChain',
          }}
        />
      </div>

      <CWTextInput
        name="tokenName"
        hookToForm
        label="Token name"
        placeholder="Name your token"
        fullWidth
      />

      <CWTextInput
        name="tokenTicker"
        hookToForm
        label="Ticker"
        placeholder="ABCD"
        fullWidth
      />

      <CWTextArea
        name="tokenDescription"
        hookToForm
        label="Description (Optional)"
        placeholder="Describe your token"
        charCount={180}
      />

      <CWCoverImageUploader
        subheaderText="Image (Optional - Accepts JPG and PNG files)"
        canSelectImageBehaviour={false}
        showUploadAndGenerateText
        onImageProcessStatusChange={setIsProcessingProfileImage}
        name="tokenImageURL"
        hookToForm
        defaultImageBehaviour={ImageBehavior.Fill}
        enableGenerativeAI
      />

      {/* Action buttons */}
      <section className="action-buttons">
        <CWButton
          type="button"
          label="Cancel"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={handleCancel}
        />
        <CWButton
          type="submit"
          buttonWidth="wide"
          label="Next"
          disabled={isProcessingProfileImage}
        />
      </section>

      <CWModal
        size="small"
        visibleOverflow
        content={
          <NewCommunityAdminModal
            onModalClose={() => setIsNewTokenCommunityAdminModalOpen(false)}
            selectedCommunity={{
              // token launch is only support for `Base`
              chainBase: ChainBase.Ethereum,
              type: CommunityType.Base,
            }}
            handleClickConnectNewWallet={handleClickConnectNewWallet}
            handleClickContinue={handleSelectedAddress}
            isTokenizedCommunity
          />
        }
        onClose={() => setIsNewTokenCommunityAdminModalOpen(false)}
        open={isNewTokenCommunityAdminModalOpen}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsNewTokenCommunityAdminModalOpen(true)}
        showWalletsFor={ChainBase.Ethereum}
      />
    </CWForm>
  );
};

export default TokenInformationForm;
