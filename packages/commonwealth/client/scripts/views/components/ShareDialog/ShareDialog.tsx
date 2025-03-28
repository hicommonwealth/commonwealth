import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { useState } from 'react';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
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
  const [resizing, setResizing] = useState(false);

  const { isWindowExtraSmall } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });

  if (isWindowExtraSmall) {
    return (
      <CWDrawer
        size="auto"
        direction="bottom"
        className="InviteLinkDrawer"
        open={true}
        onClose={onClose}
      >
        <>
          <CWModalHeader label={`Share ${title}`} onModalClose={onClose} />
          <CWModalBody>
            <ShareSection {...props} />
          </CWModalBody>
        </>
      </CWDrawer>
    );
  }

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
