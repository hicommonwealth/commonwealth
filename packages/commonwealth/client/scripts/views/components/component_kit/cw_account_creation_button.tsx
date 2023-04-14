import 'components/component_kit/cw_account_creation_button.scss';
import React from 'react';
import { CWCard } from './cw_card';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';

import { ComponentType } from './types';

type AccountCreationButtonProps = {
  creationType?: 'newAccount' | 'linkAccount';
  onClick: () => void;
};

export const CWAccountCreationButton = (props: AccountCreationButtonProps) => {
  const { creationType = 'newAccount', onClick } = props;

  return (
    <CWCard
      className={ComponentType.AccountCreationButton}
      elevation="elevation-3"
      onClick={onClick}
    >
      <CWIcon
        iconName={creationType === 'newAccount' ? 'plusCircle' : 'link'}
        iconSize="xxl"
      />
      <CWText type="h5" fontWeight="semiBold">
        {creationType === 'newAccount'
          ? 'New Account'
          : 'Link Existing Account'}
      </CWText>
    </CWCard>
  );
};
