import ModalUnstyled from '@mui/base/Modal';
import React, { FC } from 'react';

import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';

import './CWModal.scss';

export type ModalSize = 'small' | 'medium' | 'large';

interface CWModalProps {
  content: React.ReactNode;
  isFullScreen?: boolean;
  size?: ModalSize;
  onClose: (e: any) => void;
  open: boolean;
  className?: string;
  rootClassName?: string;
  visibleOverflow?: boolean;
  zIndex?: number;
}

// Backdrop is needed for modal clickaway events
// eslint-disable-next-line react/display-name
const Backdrop = React.forwardRef<
  HTMLDivElement,
  { className: string; ownerState: any }
>((props, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ownerState, ...other } = props;
  // pull out ownerState per https://github.com/mui/material-ui/issues/32882

  return <div ref={ref} {...other} />;
});

const CWModal: FC<CWModalProps> = ({
  content,
  isFullScreen,
  size,
  onClose,
  open,
  rootClassName,
  className,
  visibleOverflow,
  zIndex,
}) => (
  <ModalUnstyled
    open={open}
    onClose={onClose}
    slots={{ backdrop: Backdrop }}
    disableEnforceFocus
    className={rootClassName}
    style={{ zIndex: zIndex || null }}
  >
    <div
      className={`${getClasses(
        { isFullScreen, size, visibleOverflow },
        ComponentType.Modal,
      )} ${className}`}
    >
      {content}
    </div>
  </ModalUnstyled>
);

export default CWModal;
