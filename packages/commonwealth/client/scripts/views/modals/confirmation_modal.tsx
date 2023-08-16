import React, { useState } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { Modal } from 'views/components/component_kit/cw_modal';
import { uuidv4 } from 'lib/util';
import type { ButtonProps } from 'views/components/component_kit/new_designs/cw_button';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWModalHeader } from './CWModalHeader';

import 'modals/confirmation_modal.scss';

interface ConfirmationModalProps {
  title?: string;
  description: string | JSX.Element;
  buttons: ButtonProps[];
  removeModal: () => void;
}

const ConfirmationModal = ({
  title,
  description,
  buttons,
  removeModal,
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
    <Modal
      content={
        <div className="ConfirmationModal">
          <CWModalHeader label={title} icon="warning" onModalClose={onClose} />
          {description && (
            <CWText type="b1" className="description">
              {description}
            </CWText>
          )}
          <div className="compact-modal-footer">{actions}</div>
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
}

export const openConfirmation = (props: OpenConfirmationProps) => {
  const id = uuidv4();
  const target = document.createElement('div');
  let root: Root = null;

  target.id = id;

  const removeModal = () => {
    root.unmount();
    target.remove();
  };

  root = createRoot(target);
  root.render(<ConfirmationModal {...props} removeModal={removeModal} />);

  return { remove: removeModal };
};
