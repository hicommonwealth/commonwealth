import React, { useState } from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './CreateAccountModal.scss';
import { Option } from './Option';

const CreateAccountModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionFor,
  onSignInClick,
  onChangeModalType,
}: ModalVariantProps) => {
  const [authMethod, setAuthMethod] = useState<'wallets' | 'sso' | undefined>();

  return (
    <ModalBase
      onClose={onClose}
      onSuccess={onSuccess}
      layoutType={AuthModalType.CreateAccount}
      hideDescription={!!authMethod}
      {...(authMethod && {
        showAuthOptionTypesFor: [authMethod],
      })}
      showWalletsFor={showWalletsFor}
      showAuthOptionFor={showAuthOptionFor}
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
      onChangeModalType={onChangeModalType}
    />
  );
};

export { CreateAccountModal };
