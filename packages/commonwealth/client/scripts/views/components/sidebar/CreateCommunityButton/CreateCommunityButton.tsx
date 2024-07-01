import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from '../../../../../../shared/analytics/types';
import useAppStatus from '../../../../hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from '../../../../hooks/useBrowserAnalyticsTrack';
import './CreateCommunityButton.scss';

const CreateCommunityButton = () => {
  const navigate = useCommonNavigate();

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const handleCreateCommunity = () => {
    trackAnalytics({
      event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
      isPWA: isAddedToHomeScreen,
    });
    navigate('/createCommunity', {}, null);
  };

  return (
    <div className="CreateCommunityButton">
      <CWButton
        label="Create Community"
        buttonHeight="sm"
        buttonWidth="full"
        onClick={handleCreateCommunity}
      />
    </div>
  );
};

export default CreateCommunityButton;
