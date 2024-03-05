import { notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { ModalSize } from 'views/components/component_kit/new_designs/CWModal/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { openConfirmation } from 'views/modals/confirmation_modal';

const ModalsShowcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<ModalSize>('small');

  const setModal = (size?: ModalSize) => {
    setModalSize(size);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex-row">
        <CWButton
          buttonHeight="sm"
          label="Small Modal"
          onClick={() => setModal('small')}
        />
        <CWButton
          buttonHeight="sm"
          label="Medium Modal"
          onClick={() => setModal('medium')}
        />
        <CWButton
          buttonHeight="sm"
          label="Large Modal"
          onClick={() => setModal('large')}
        />
        <CWButton
          buttonHeight="sm"
          label="Full Screen Modal"
          onClick={() => setModal()}
        />

        <CWButton
          buttonHeight="sm"
          label="Confirmation Modal"
          onClick={() =>
            openConfirmation({
              title: 'Warning',
              description: (
                <>
                  Do you really want to <b>delete</b> this item?
                </>
              ),
              buttons: [
                {
                  label: 'Cancel',
                  buttonType: 'secondary',
                  buttonHeight: 'sm',
                  onClick: () => {
                    console.log('cancelled');
                  },
                },
                {
                  label: 'Delete',
                  buttonType: 'primary',
                  buttonHeight: 'sm',
                  onClick: () => {
                    notifySuccess('Deleted');
                  },
                },
              ],
            })
          }
        />
      </div>

      <CWModal
        content={
          <>
            <CWModalHeader
              label={`A ${modalSize || 'full screen'} modal`}
              onModalClose={() => setIsModalOpen(false)}
            />
            <CWModalBody>
              <CWText>hi</CWText>
            </CWModalBody>

            {modalSize && (
              <CWModalFooter>
                <CWButton
                  label="Cancel"
                  buttonType="secondary"
                  buttonHeight="sm"
                  onClick={() => setIsModalOpen(false)}
                />
                <CWButton
                  label="Save settings"
                  buttonType="primary"
                  buttonHeight="sm"
                />
              </CWModalFooter>
            )}
          </>
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        size={modalSize}
        isFullScreen={!modalSize}
      />
    </>
  );
};

export default ModalsShowcase;
