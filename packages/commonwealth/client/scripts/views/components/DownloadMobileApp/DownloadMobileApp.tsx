import React, { useState } from 'react';
import { DownloadMobileAppModal } from 'views/components/DownloadMobileApp/DownloadMobileAppModal';

export const DownloadMobileApp = () => {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      {modalActive && (
        <DownloadMobileAppModal onClose={() => setModalActive(false)} />
      )}
    </>
  );

  // TODO: make this a button
};
