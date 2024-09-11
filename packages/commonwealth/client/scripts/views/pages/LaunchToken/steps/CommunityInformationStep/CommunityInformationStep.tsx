import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import CommunityInformationForm from 'views/components/CommunityInformationForm/CommunityInformationForm';
import { CWText } from 'views/components/component_kit/cw_text';
import { openConfirmation } from 'views/modals/confirmation_modal';
import './CommunityInformationStep.scss';

interface CommunityInformationStepProps {
  handleGoBack: () => void;
  handleContinue: () => void;
}

const CommunityInformationStep = ({
  handleGoBack,
  handleContinue,
}: CommunityInformationStepProps) => {
  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const handleSubmit = async (values: any) => {
    // TODO 8706: integrate endpoint
    console.log('values => ', values);
    handleContinue();
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

      <CommunityInformationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isCreatingCommunity={false}
        submitBtnLabel="Next"
        withSocialLinks={true}
      />
    </div>
  );
};

export default CommunityInformationStep;
