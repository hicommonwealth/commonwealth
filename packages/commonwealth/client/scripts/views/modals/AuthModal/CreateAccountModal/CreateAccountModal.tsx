import React, { useState } from 'react';
import { ModalBase } from '../common/ModalBase';
import { ModalVariantProps } from '../types';
import './CreateAccountModal.scss';
import { Option } from './Option';

const CreateAccountModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  onSignInClick,
}: ModalVariantProps) => {
  const [authMethod, setAuthMethod] = useState<'wallets' | 'sso' | undefined>();

  return (
    <ModalBase
      onClose={onClose}
      // TODO: handle post-account creation flow on new acc creation
      onSuccess={onSuccess}
      layoutType="create-account"
      hideDescription={!!authMethod}
      {...(authMethod && {
        showAuthenticationOptionsFor: [authMethod],
      })}
      showWalletsFor={showWalletsFor}
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
      onSignInClick={onSignInClick}
    />
  );
};

export { CreateAccountModal };
