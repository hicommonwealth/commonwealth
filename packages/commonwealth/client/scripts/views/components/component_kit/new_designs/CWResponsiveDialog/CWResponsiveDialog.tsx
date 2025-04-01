import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { ReactNode, useState } from 'react';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import './CWResponsiveDialog.scss';

type CWResponsiveDialogProps = {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
};

export const CWResponsiveDialog = (props: CWResponsiveDialogProps) => {
  const { onClose, children, open } = props;
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
        className="CWResponsiveDialog"
        open={open}
        onClose={onClose}
      >
        <>{children}</>
      </CWDrawer>
    );
  }

  return (
    <CWModal
      size="small"
      className="CWResponsiveDialog"
      content={<>{children}</>}
      onClose={onClose}
      open={open}
    />
  );
};
