import React, { useState } from 'react';
import { ModalBase } from '../common/ModalBase';
import { CreateAccountModal } from '../types';
import './CreateAccountModal.scss';
import { Option } from './Option';

const CreateAccountModal = ({ onClose }: CreateAccountModal) => {
  const [showWallets, setShowWallets] = useState(false);

  return (
    <ModalBase
      onClose={onClose}
      // TODO: will be replaced with post-account creation flow
      onAuthenticated={(isNewlyCreated) => console.log({ isNewlyCreated })}
      layoutType="create-account"
      hideDescription={showWallets}
      {...(showWallets && {
        showAuthenticationOptionsFor: ['wallets'],
      })}
      customBody={
        !showWallets && (
          <>
            <Option
              type="existing-wallet"
              onClick={() => setShowWallets(true)}
            />
            <Option
              type="new-wallet"
              onClick={() => {
                /** TODO */
              }}
            />
          </>
        )
      }
      bodyClassName="CreateAccountModal"
    />
  );
};

export { CreateAccountModal };
