import { isMobileApp } from 'hooks/useReactNativeWebView';
import React, { useState } from 'react';
import { DownloadMobileAppModal } from 'views/components/DownloadMobileApp/DownloadMobileAppModal';
import { CWButton } from '../component_kit/new_designs/CWButton';

export const DownloadMobileApp = () => {
  const [modalActive, setModalActive] = useState(false);

  if (isMobileApp()) {
    // we're already the mobile app, so we're done.
    return null;
  }

  return (
    <>
      <CWButton
        buttonType="secondary"
        buttonHeight="sm"
        label="Download Mobile App"
        onClick={() => setModalActive(true)}
      />

      {modalActive && (
        <DownloadMobileAppModal onClose={() => setModalActive(false)} />
      )}
    </>
  );
};
