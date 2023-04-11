import React from 'react';
import ModalUnstyled from '@mui/base/ModalUnstyled';

import 'components/component_kit/cw_modal.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';

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

export const Modal = (props: {
  content: React.ReactNode;
  isFullScreen?: boolean;
  onClose: () => void;
  open: boolean;
  className?: string;
}) => {
  const { content, isFullScreen, onClose, open, className } = props;

  return (
    <ModalUnstyled open={open} onClose={onClose} slots={{ backdrop: Backdrop }}>
      <div
        className={`${getClasses<{ isFullScreen?: boolean }>(
          { isFullScreen },
          ComponentType.Modal
        )} ${className}`}
      >
        {content}
      </div>
    </ModalUnstyled>
  );
};
