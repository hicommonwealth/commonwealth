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
};

export const ShareDialog = (props: ShareDialogProps) => {
  const { onClose, title } = props;

  return (
    <ResponsiveDialog onClose={onClose}>
      <>
        <CWModalHeader label={`Share ${title}`} onModalClose={onClose} />
        <CWModalBody>
          <CWText>
            For every referral, you ll soon get offchain and onchain rewards,
            like fees from trades, swaps, and transactions they make on Common
          </CWText>

          <ShareSection {...props} />
        </CWModalBody>
      </>
    </ResponsiveDialog>
  );
};
