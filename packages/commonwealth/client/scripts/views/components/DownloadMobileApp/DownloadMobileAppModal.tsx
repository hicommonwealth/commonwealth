import React from 'react';
import {
  CWModal,
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { DownloadMobileAppContent } from 'views/components/DownloadMobileApp/DownloadMobileAppContent';

type DownloadMobileAppModal = {
  onClose: () => void;
};

export const DownloadMobileAppModal = (props: DownloadMobileAppModal) => {
  const { onClose } = props;
  return (
    <CWModal
      size="small"
      content={
        <>
          <CWModalHeader label="Download Mobile App" onModalClose={onClose} />
          <CWModalBody>
            <DownloadMobileAppContent />
          </CWModalBody>
        </>
      }
      onClose={onClose}
      open={true}
    ></CWModal>
  );
};
