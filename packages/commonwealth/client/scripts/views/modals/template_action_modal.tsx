import React from 'react';
import { Modal } from '../components/component_kit/cw_modal';
import ViewTemplateForm from '../pages/view_template/view_template_form'; // Import the extracted form component

type TemplateFormModalProps = {
  isOpen: boolean;
  threadContent: string; // Pass the thread content to the form
  onSave: () => void;
  onClose: () => void;
};

export const TemplateActionModal = ({
  isOpen,
  threadContent,
  onSave,
  onClose,
}: TemplateFormModalProps) => {
  return (
    <Modal
      content={
        <ViewTemplateForm
          threadContent={threadContent}
          onSave={onSave}
          onModalClose={onClose}
        />
      }
      onClose={onClose}
      open={isOpen}
    />
  );
};
