import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWResponsiveDialog } from 'views/components/component_kit/new_designs/CWResponsiveDialog';
import { ShareModal } from 'views/components/ShareDialog/ShareModal';

type ShareDialogProps = {
  onClose: () => void;
  url: string;
  open: boolean;
  title?: string;
  text?: string;
  shareType: 'thread' | 'comment';
};

export const ShareDialog = (props: ShareDialogProps) => {
  const { onClose, title, shareType, open } = props;

  return (
    <CWResponsiveDialog onClose={onClose} open={open}>
      <ShareModal
        headerLabel={`Share ${title ? title : shareType}`}
        BodyContent={() => (
          <CWText>
            When you share this link for this {shareType} you will also get
            referral bonuses for any user that signs up.
          </CWText>
        )}
        {...props}
      />
    </CWResponsiveDialog>
  );
};
