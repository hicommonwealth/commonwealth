import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React, { useEffect, useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelCommunityCreationEvent,
  MixpanelLoginPayload,
} from 'shared/analytics/types';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import QuickTokenLaunchForm from '../../../LaunchToken/QuickTokenLaunchForm';
// eslint-disable-next-line max-len
import { triggerTokenLaunchFormAbort } from '../../../LaunchToken/QuickTokenLaunchForm/steps/TokenInformationFormStep/helpers';
import './TokenLaunchDrawer.scss';

type TokenLaunchDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  initialIdeaPrompt?: string;
  generateIdeaOnMount?: boolean;
};

export const TokenLaunchDrawer = ({
  isOpen,
  onClose,
  initialIdeaPrompt,
  generateIdeaOnMount = false,
}: TokenLaunchDrawerProps) => {
  const { isAddedToHomeScreen } = useAppStatus();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { trackAnalytics } = useBrowserAnalyticsTrack<
    MixpanelLoginPayload | BaseMixpanelPayload
  >({
    onAction: true,
  });

  const [createdCommunityId, setCreatedCommunityId] = useState<string>();

  // Manage drawer state at root level
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('token-launch-drawer-open');
    } else {
      document.body.classList.remove('token-launch-drawer-open');
    }
    return () => {
      document.body.classList.remove('token-launch-drawer-open');
    };
  }, [isOpen]);

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
          <div className="button-container">
            <span className="counter">1 / 1</span>
            <CWButton
              iconLeft="brain"
              label={isMobile ? 'Random' : 'Randomize'}
              onClick={() => {
                /* existing click handler */
              }}
            />
            <CWButton
              iconLeft="rocketLaunch"
              label={isMobile ? 'Launch' : 'Launch Token'}
              onClick={() => {
                /* existing click handler */
              }}
            />
          </div>

          {isOpen && (
            <QuickTokenLaunchForm
              onCancel={handleDrawerCloseTrigger}
              onCommunityCreated={setCreatedCommunityId}
              initialIdeaPrompt={initialIdeaPrompt}
              generateIdeaOnMount={generateIdeaOnMount}
            />
          )}
        </div>
      </CWDrawer>
    </div>
  );
};
