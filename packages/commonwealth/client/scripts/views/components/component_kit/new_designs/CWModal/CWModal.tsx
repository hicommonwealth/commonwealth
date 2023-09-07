import React from 'react';
import ModalUnstyled from '@mui/base/Modal';

import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';

import './CWModal.scss';

export type Size = 'small' | 'medium' | 'large';

// Backdrop is needed for modal clickaway events
const Backdrop = React.forwardRef<
  HTMLDivElement,
  { className: string; ownerState: any }
>((props, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ownerState, ...other } = props;
  // pull out ownerState per https://github.com/mui/material-ui/issues/32882

  return <div ref={ref} {...other} />;
});

const CWModal = (props: {
  content: React.ReactNode;
  isFullScreen?: boolean;
  size?: Size;
  onClose: () => void;
  open: boolean;
  className?: string;
}) => {
  const {
    content,
    isFullScreen,
    size = 'small',
    onClose,
    open,
    className,
  } = props;

  return (
    <ModalUnstyled
      open={open}
      onClose={onClose}
      slots={{ backdrop: Backdrop }}
      disableEnforceFocus
    >
      <div
        className={`${getClasses(
          { isFullScreen, size },
          ComponentType.Modal
        )} ${className}`}
      >
        {content}
      </div>
    </ModalUnstyled>
  );
};

export default CWModal;
