import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import { useFetchTokensQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { useDebounce } from 'usehooks-ts';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
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
import { communityTypeOptions } from 'views/pages/CreateCommunity/steps/CommunityTypeStep/helpers';
import './TokenInformationForm.scss';
import { triggerTokenLaunchFormAbort } from './helpers';
import { FormSubmitValues, TokenInformationFormProps } from './types';
import { tokenInformationFormValidationSchema } from './validation';

const TokenInformationForm = ({
  onSubmit,
  onCancel,
  onFormUpdate,
  onAddressSelected,
  selectedAddress,
  containerClassName,
  customFooter,
  forceFormValues,
  focusField,
  formDisabled,
  openAddressSelectorOnMount = true,
  imageControlProps = {},
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
  const [tokenName, setTokenName] = useState<string>();

  const { isAddedToHomeScreen } = useAppStatus();

  const debouncedSearchTerm = useDebounce<string | undefined>(tokenName, 500);

  const { data: tokensList } = useFetchTokensQuery({
    cursor: 1,
    limit: 50,
    search: debouncedSearchTerm,
    enabled: !!debouncedSearchTerm,
  });

  const isTokenNameTaken =
    tokensList && debouncedSearchTerm
      ? !!tokensList.pages[0].results.find(
          ({ name }) =>
            name.toLowerCase().trim() ===
            debouncedSearchTerm.toLowerCase().trim(),
        )
      : false;

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

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
    shouldRun: openAddressSelectorOnMount,
  });

  const handleSubmit = useCallback(
    (values: FormSubmitValues) => {
      if (isTokenNameTaken) return;

      // get address from user
      if (!selectedAddress) {
        openAddressSelectionModal();
        shouldSubmitOnAddressSelection.current = true;
        return;
      }

      onSubmit(values); // token gets created with signature step, this info is only used to generate community details
    },
    [isTokenNameTaken, openAddressSelectionModal, selectedAddress, onSubmit],
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

  useEffect(() => {
    if (forceFormValues && formMethodsRef.current) {
      for (const [key, value] of Object.entries(forceFormValues)) {
        if (value) {
          value &&
            formMethodsRef.current.setValue(key, value, { shouldDirty: true });
        }
      }
    }
  }, [forceFormValues]);

  useEffect(() => {
    if (focusField && formMethodsRef.current) {
      formMethodsRef.current.setFocus(focusField);
    }
  }, [focusField]);

  const handleCancel = () => {
    triggerTokenLaunchFormAbort(() => {
      trackAnalytics({
        event: MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_CANCELLED,
        isPWA: isAddedToHomeScreen,
      });

      onCancel();
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
      onSubmit={handleSubmit}
      onWatch={onFormUpdate}
      validationSchema={tokenInformationFormValidationSchema}
      className={clsx('TokenInformationForm', containerClassName)}
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
            name: 'chain',
          }}
        />
      </div>

      <div className="grid-row">
        <CWTextInput
          name="name"
          hookToForm
          label="Token name"
          placeholder="Name your token"
          fullWidth
          onInput={(e) => setTokenName(e.target.value?.trim())}
          customError={isTokenNameTaken ? 'Token name is already taken' : ''}
          disabled={formDisabled}
        />

        <CWTextInput
          name="symbol"
          hookToForm
          label="Ticker"
          placeholder="ABCD"
          fullWidth
          disabled={formDisabled}
        />
      </div>

      <CWTextArea
        name="description"
        hookToForm
        label="Description (Optional)"
        placeholder="Describe your token"
        charCount={180}
        disabled={formDisabled}
      />

      <CWImageInput
        label="Image (Accepts JPG and PNG files)"
        canSelectImageBehavior={false}
        onImageProcessingChange={({ isGenerating, isUploading }) =>
          setIsProcessingProfileImage(isGenerating || isUploading)
        }
        name="imageURL"
        hookToForm
        imageBehavior={ImageBehavior.Circle}
        withAIImageGeneration
        disabled={formDisabled}
        {...imageControlProps}
      />

      {/* Action buttons */}
      {customFooter ? (
        customFooter({ isProcessingProfileImage })
      ) : (
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
      )}

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
