import useAppStatus from 'hooks/useAppStatus';
import { isMobileApp } from 'hooks/useReactNativeWebView';
import React, { useState } from 'react';
import { DownloadMobileAppModal } from 'views/components/DownloadMobileApp/DownloadMobileAppModal';
import { IOS_APP_STORE_LANDING_URL } from 'views/components/DownloadMobileApp/MobileLandingURLs';
import { useDeviceProfile } from 'views/components/MarkdownEditor/useDeviceProfile';
import { CWButton } from '../component_kit/new_designs/CWButton';
import CWIconButton from '../component_kit/new_designs/CWIconButton';
import './DownloadMobileApp.scss';

export const DownloadMobileApp = () => {
  const [modalActive, setModalActive] = useState(false);

  const deviceProfile = useDeviceProfile();
  const { isIOS } = useAppStatus();

  if (isMobileApp()) {
    // we're already the mobile app, so we're done.
    return null;
  }

  if (deviceProfile === 'desktop') {
    return (
      <>
        <div className="DownloadMobileAppButton">
          <CWButton
            buttonType="secondary"
            buttonHeight="sm"
            label="Download Mobile App"
            iconLeft="download"
            onClick={() => setModalActive(true)}
          />
        </div>

        {modalActive && (
          <DownloadMobileAppModal onClose={() => setModalActive(false)} />
        )}
      </>
    );
  }

  if (isIOS)
    return (
      <>
        <div className="DownloadMobileAppButton">
          <CWIconButton
            iconName="download"
            onClick={() => {
              document.location.href = IOS_APP_STORE_LANDING_URL;
            }}
          />
        </div>
      </>
    );
  return null;
};
