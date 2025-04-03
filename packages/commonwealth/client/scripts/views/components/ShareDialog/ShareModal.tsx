import React, { ReactNode } from 'react';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import ShareSection from 'views/components/ShareSection';

type ShareModalProps = {
  onClose: () => void;
  url: string;
  open: boolean;
  title?: string;
  text?: string;
  dialogTitle: string;
  shareType: 'thread' | 'comment';
  headerLabel: string;
  BodyContent: () => ReactNode;
};

export const ShareModal = (props: ShareModalProps) => {
  const { onClose, BodyContent, headerLabel } = props;

  return (
    <>
      <div
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <CWModalHeader label={headerLabel} onModalClose={onClose} />
        <CWModalBody>
          <BodyContent />
          <ShareSection {...props} />
        </CWModalBody>
      </div>
      <CWModalFooter>
        <></>
      </CWModalFooter>
    </>
  );
};
