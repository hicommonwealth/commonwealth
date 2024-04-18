import React from 'react';
import { ModalLayout } from '../common/ModalLayout';
import { CreateAccountModal } from '../types';
import './CreateAccountModal.scss';
import { Option } from './Option';

const CreateAccountModal = ({ onClose }: CreateAccountModal) => {
  return (
    <ModalLayout
      onClose={onClose}
      type="create-account"
      body={
        <>
          <Option
            type="existing-wallet"
            onClick={() => {
              /** TODO */
            }}
          />
          <Option
            type="new-wallet"
            onClick={() => {
              /** TODO */
            }}
          />
        </>
      }
      bodyClassName="CreateAccountModal"
    />
  );
};

export { CreateAccountModal };
