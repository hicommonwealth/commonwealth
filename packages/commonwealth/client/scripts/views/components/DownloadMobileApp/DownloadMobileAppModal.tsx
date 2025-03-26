import React from 'react';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { DownloadMobileAppContent } from 'views/components/DownloadMobileApp/DownloadMobileAppContent';

type DownloadMobileAppModal = {
  onClose: () => void;
};

export const DownloadMobileAppModal = (props: DownloadMobileAppModal) => {
  const { onClose } = props;
  return (
    <CWModal
      size="small"
      content={<DownloadMobileAppContent />}
      onClose={onClose}
      open={true}
    />
  );
};
