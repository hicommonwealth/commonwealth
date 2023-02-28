import React, { useState } from 'react';

import { Modal } from 'views/components/component_kit/cw_modal';
import { uuidv4 } from 'lib/util';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import type { ButtonProps } from 'views/components/component_kit/cw_button';
import { CWButton } from 'views/components/component_kit/cw_button';

const OpenAlertComponent = ({ title, message, buttons, removeModal }) => {
  const [open, setOpen] = useState(true);

  const onClose = () => {
    setOpen(false);
    removeModal();
  };

  const actions = buttons.map((button, index) => (
    <CWButton key={index} {...button} />
  ));

  return (
    <Modal
      content={
        <>
          <div>
            {title && <div>{title}</div>}
            {message && <div>{message}</div>}
          </div>
          <div>{actions}</div>
        </>
      }
      onClose={onClose}
      open={open}
    />
  );
};

export const openAlert = (props: {
  title: string;
  message: string;
  buttons: ButtonProps[];
}) => {
  const id = uuidv4();
  const target = document.createElement('div');
  let root: Root = null;

  target.id = id;

  const removeModal = () => {
    root.unmount();
    target.remove();
  };

  root = createRoot(target);
  root.render(<OpenAlertComponent {...props} removeModal={removeModal} />);

  return { remove: removeModal };
};
