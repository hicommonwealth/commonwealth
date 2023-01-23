import ModalUnstyled from '@mui/base/ModalUnstyled';
import React, { ElementType } from 'react';
import 'components/component_kit/cw_react_modal.scss';

const Backdrop = React.forwardRef<
  HTMLDivElement,
  { open?: boolean; className: string }
>((props, ref) => {
  const { open, className, ...other } = props;
  return (
    <div className={'MuiBackdrop-open modal-backdrop'} ref={ref} {...other} />
  );
});

export default function CWReactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <ModalUnstyled open={open} onClose={onClose} slots={{ backdrop: Backdrop }}>
      <div style={{ width: '200px', height: '200px' }}>hellooooo</div>
    </ModalUnstyled>
  );
}
