import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React, { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
// eslint-disable-next-line max-len
import { triggerTokenLaunchFormAbort } from '../../../LaunchToken/steps/TokenInformationStep/TokenInformationForm/helpers';
import QuickTokenLaunchForm from '../QuickTokenLaunchForm';
import './TokenLaunchDrawer.scss';

type TokenLaunchDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const TokenLaunchDrawer = ({
  isOpen,
  onClose,
}: TokenLaunchDrawerProps) => {
  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const [createdCommunityId, setCreatedCommunityId] = useState<string>();

  const handleDrawerCloseTrigger = () => {
    if (createdCommunityId) {
      onClose();
      return;
    }

    triggerTokenLaunchFormAbort(() => {
      trackAnalytics({
        event: MixpanelCommunityCreationEvent.CREATE_TOKEN_COMMUNITY_CANCELLED,
        isPWA: isAddedToHomeScreen,
      });

      onClose();
    });
  };

  return (
    <div className="TokenLaunchDrawer">
      <CWDrawer
        overlayOpacity={0.5}
        className="filter-drawer"
        open={isOpen}
        onClose={handleDrawerCloseTrigger}
      >
        <div className="gradiant-container">
          <CWDrawerTopBar onClose={handleDrawerCloseTrigger} />

          {isOpen && (
            <QuickTokenLaunchForm
              onCancel={handleDrawerCloseTrigger}
              onCommunityCreated={setCreatedCommunityId}
            />
          )}
        </div>
      </CWDrawer>
    </div>
  );
};
