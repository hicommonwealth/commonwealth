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
import './TokenLaunchButton.scss';

type TokenLaunchButtonProps = {
  buttonHeight?: ButtonHeight;
};

const TokenLaunchButton = ({ buttonHeight }: TokenLaunchButtonProps) => {
  const navigate = useCommonNavigate();

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const handleLaunchTokenCommunity = () => {
    trackAnalytics({
      event: MixpanelCommunityCreationEvent.CREATE_TOKEN_BUTTON_PRESSED,
      isPWA: isAddedToHomeScreen,
    });
    navigate('/createTokenCommunity', {}, null);
  };

  return (
    <div className="TokenLaunchButton">
      <CWButton
        label="Launch Token"
        buttonHeight={buttonHeight || 'med'}
        buttonWidth="full"
        iconLeft="rocketLaunch"
        onClick={handleLaunchTokenCommunity}
      />
    </div>
  );
};

export default TokenLaunchButton;
