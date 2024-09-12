import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React, { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/cw_cover_image_uploader';
import { CWLabel } from 'views/components/component_kit/cw_label';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCommunitySelector from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { communityTypeOptions } from 'views/pages/CreateCommunity/steps/CommunityTypeStep/helpers';
import './TokenInformationForm.scss';
import { FormSubmitValues, TokenInformationFormProps } from './types';
import { tokenInformationFormValidationSchema } from './validation';

const TokenInformationForm = ({
  onSubmit,
  onCancel,
}: TokenInformationFormProps) => {
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);

  const { isAddedToHomeScreen } = useAppStatus();

  const [baseOption] = communityTypeOptions;

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const handleSubmit = (values: FormSubmitValues) => {
    // TODO 8705: call token launch endpoint
    console.log('values => ', values);
    onSubmit();
  };

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

  return (
    <CWForm
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
    </CWForm>
  );
};

export default TokenInformationForm;
