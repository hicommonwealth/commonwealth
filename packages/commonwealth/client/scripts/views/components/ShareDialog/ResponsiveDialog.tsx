import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { ReactNode, useState } from 'react';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import './ResponsiveDialog.scss';

type ResponsiveDialogProps = {
  children: ReactNode;
  onClose: () => void;
};

export const ResponsiveDialog = (props: ResponsiveDialogProps) => {
  const { onClose, children } = props;
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
        className="ResponsiveDialog"
        open={true}
        onClose={onClose}
      >
        <>{children}</>
      </CWDrawer>
    );
  }

  return (
    <CWModal
      size="small"
      className="ResponsiveDialog"
      content={<>{children}</>}
      onClose={onClose}
      open={true}
    />
  );
};
