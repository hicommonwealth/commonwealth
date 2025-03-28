import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import ShareSection from 'views/components/ShareSection';
import { ResponsiveDialog } from './ResponsiveDialog';

type ShareDialogProps = {
  onClose: () => void;
  url: string;
  title?: string;
  text?: string;
  dialogTitle: string;
  shareType: 'thread';
};

export const ShareDialog = (props: ShareDialogProps) => {
  const { onClose, title, shareType } = props;

  return (
    <ResponsiveDialog onClose={onClose}>
      <div
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <CWModalHeader label={`Share ${title}`} onModalClose={onClose} />
        <CWModalBody>
          <CWText>
            When you share this link for this {shareType} you will also get
            referral bonuses for any user that signs up.
          </CWText>

          <ShareSection {...props} />
        </CWModalBody>
      </div>
    </ResponsiveDialog>
  );
};
