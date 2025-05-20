import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { ReactNode, useState } from 'react';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import './CWResponsiveDialog.scss';

type CWResponsiveDialogProps = {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  className?: string;
};

export const CWResponsiveDialog = (props: CWResponsiveDialogProps) => {
  const { onClose, children, open, className } = props;
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
        className={clsx('CWResponsiveDialog', className)}
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
      className={clsx('CWResponsiveDialog', className)}
      content={<>{children}</>}
      onClose={onClose}
      open={open}
    />
  );
};
