/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_account_creation_button.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCard } from './cw_card';
import { CWText } from './cw_text';

type AccountCreationButtonAttrs = {
  creationType: 'newAccount' | 'linkAccount';
  onclick: () => void;
};

export class CWAccountCreationButton
  implements m.ClassComponent<AccountCreationButtonAttrs>
{
  view(vnode) {
    const { creationType = 'newAccount', onclick } = vnode.attrs;

    return (
      <CWCard
        className={ComponentType.AccountCreationButton}
        elevation="elevation-3"
        onclick={onclick}
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
  }
}
