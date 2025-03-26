import React, { useState } from 'react';
import { DownloadMobileAppModal } from 'views/components/DownloadMobileApp/DownloadMobileAppModal';
import { CWButton } from '../component_kit/new_designs/CWButton';

export const DownloadMobileApp = () => {
  const [modalActive, setModalActive] = useState(false);

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
