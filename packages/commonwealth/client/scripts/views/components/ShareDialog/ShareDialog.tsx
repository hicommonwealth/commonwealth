import React from 'react';
import {
  CWModal,
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { DownloadMobileAppContent } from 'views/components/DownloadMobileApp/DownloadMobileAppContent';
import { ShareSectionProps } from '../ShareSection';

type ShareDialogProps = ShareSectionProps & {
  onClose: () => void;
};

export const ShareDialog = (props: ShareDialogProps) => {
  const { onClose, title } = props;

  return (
    <CWModal
      size="small"
      className="DownloadMobileAppModal"
      content={
        <>
          <CWModalHeader label={`Share ${title}`} onModalClose={onClose} />
          <CWModalBody>
            <DownloadMobileAppContent />
          </CWModalBody>
        </>
      }
      onClose={onClose}
      open={true}
    />
  );
};
