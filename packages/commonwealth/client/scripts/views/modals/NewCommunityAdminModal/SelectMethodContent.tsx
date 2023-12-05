import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import CWModalSelectButton from 'views/components/component_kit/new_designs/CWModalSelectButton';

export enum SignInMethod {
  Wallet = 'Wallet',
  EmailOrSocial = 'EmailOrSocial',
}

interface SelectMethodContentProps {
  onModalClose: () => void;
  handleSelectButtonClick: (method: SignInMethod) => void;
}

const SelectMethodContent = ({
  onModalClose,
  handleSelectButtonClick,
}: SelectMethodContentProps) => {
  return (
    <>
      <CWModalHeader label="New community admin" onModalClose={onModalClose} />
      <CWModalBody>
        <CWText type="b1" className="description">
          In order to launch a community within an ecosystem you must have a
          compatible wallet connected. How would you like to create your
          community?
        </CWText>
        <CWModalSelectButton
          id={SignInMethod.Wallet}
          header="Connect wallet"
          subheader="Connect a compatible wallet"
          onClick={handleSelectButtonClick}
        />
        <CWModalSelectButton
          id={SignInMethod.EmailOrSocial}
          header="Email or social"
          headerInfo="(Magic Link)"
          subheader="Use a wallet associated with your email"
          onClick={handleSelectButtonClick}
        />
      </CWModalBody>
    </>
  );
};

export default SelectMethodContent;
