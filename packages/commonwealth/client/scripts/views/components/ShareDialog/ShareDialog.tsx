import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWResponsiveDialog } from 'views/components/component_kit/new_designs/CWResponsiveDialog';
import ShareSection from 'views/components/ShareSection';

type ShareDialogProps = {
  onClose: () => void;
  url: string;
  open: boolean;
  title?: string;
  text?: string;
  dialogTitle: string;
  shareType: 'thread' | 'comment';
};

export const ShareDialog = (props: ShareDialogProps) => {
  const { onClose, title, shareType, open } = props;

  return (
    <CWResponsiveDialog onClose={onClose} open={open}>
      <div
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <CWModalHeader
          label={`Share ${title ? title : shareType}`}
          onModalClose={onClose}
        />
        <CWModalBody>
          <CWText>
            When you share this link for this {shareType} you will also get
            referral bonuses for any user that signs up.
          </CWText>

          <ShareSection {...props} />
        </CWModalBody>
      </div>
    </CWResponsiveDialog>
  );
};
