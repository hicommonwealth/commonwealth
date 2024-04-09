import clsx from 'clsx';
import React, { useState } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { uuidv4 } from '../../lib/util';
import { CWText } from '../components/component_kit/cw_text';
import type { ButtonProps } from '../components/component_kit/new_designs/CWButton';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import '../../../styles/modals/confirmation_modal.scss';

interface ConfirmationModalProps {
  title?: string;
  description: string | JSX.Element;
  buttons: ButtonProps[];
  removeModal: () => void;
  className?: string;
}

const ConfirmationModal = ({
  title,
  description,
  buttons,
  removeModal,
  className,
}: ConfirmationModalProps) => {
  const [open, setOpen] = useState(true);

  const onClose = () => {
    setOpen(false);
    removeModal();
  };

  const actions = buttons.map((button, index) => (
    <CWButton
      key={index}
      {...button}
      onClick={(e) => {
        onClose();
        button.onClick?.(e);
      }}
    />
  ));

  return (
    <CWModal
      size="small"
      content={
        <div className={clsx('ConfirmationModal', className)}>
          <CWModalHeader label={title} icon="warning" onModalClose={onClose} />
          <CWModalBody>
            {description && (
              <CWText type="b1" className="description">
                {description}
              </CWText>
            )}
          </CWModalBody>
          {actions?.length ? <CWModalFooter>{actions}</CWModalFooter> : null}
        </div>
      }
      onClose={onClose}
      open={open}
    />
  );
};

interface OpenConfirmationProps {
  title?: string;
  description: string | JSX.Element;
  buttons: ButtonProps[];
  className?: string;
  onClose?: () => void;
}

export const openConfirmation = (props: OpenConfirmationProps) => {
  const id = uuidv4();
  const target = document.createElement('div');
  let root: Root = null;

  target.id = id;

  const removeModal = () => {
    root.unmount();
    target.remove();
    if (typeof props.onClose === 'function') {
      props.onClose();
    }
  };

  root = createRoot(target);
  root.render(<ConfirmationModal {...props} removeModal={removeModal} />);

  return { remove: removeModal };
};
