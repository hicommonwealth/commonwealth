import React from 'react';
import {
  CWModal,
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import ShareSection from 'views/components/ShareSection';

type ShareDialogProps = {
  onClose: () => void;
  url: string;
  title?: string;
  text?: string;
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
            <ShareSection {...props} />
          </CWModalBody>
        </>
      }
      onClose={onClose}
      open={true}
    />
  );
};
