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
import { ButtonHeight } from '../../component_kit/new_designs/CWButton/CWButton';
import './CreateCommunityButton.scss';

type CreateCommunityButtonProps = {
  withIcon?: boolean;
  buttonHeight?: ButtonHeight;
};

const CreateCommunityButton = ({
  withIcon = false,
  buttonHeight = 'sm',
}: CreateCommunityButtonProps) => {
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
        buttonHeight={buttonHeight}
        buttonWidth="full"
        {...(withIcon && { iconLeft: 'peopleNew' })}
        onClick={handleCreateCommunity}
      />
    </div>
  );
};

export default CreateCommunityButton;
