import React, { useState } from 'react';
import { ModalBase } from '../common/ModalBase';
import { CreateAccountModal } from '../types';
import './CreateAccountModal.scss';
import { Option } from './Option';

const CreateAccountModal = ({ onClose }: CreateAccountModal) => {
  const [authMethod, setAuthMethod] = useState<'wallets' | 'sso' | undefined>();

  return (
    <ModalBase
      onClose={onClose}
      // TODO: will be replaced with post-account creation flow
      onAuthenticated={(isNewlyCreated) => console.log({ isNewlyCreated })}
      layoutType="create-account"
      hideDescription={!!authMethod}
      {...(authMethod && {
        showAuthenticationOptionsFor: [authMethod],
      })}
      customBody={
        !authMethod && (
          <>
            <Option
              type="existing-wallet"
              onClick={() => setAuthMethod('wallets')}
            />
            <Option type="new-wallet" onClick={() => setAuthMethod('sso')} />
          </>
        )
      }
      bodyClassName="CreateAccountModal"
    />
  );
};

export { CreateAccountModal };
