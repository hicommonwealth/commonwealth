/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_account_creation_button.scss';
import m from 'mithril';
import { CWCard } from './cw_card';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';

import { ComponentType } from './types';

type AccountCreationButtonAttrs = {
  creationType?: 'newAccount' | 'linkAccount';
  onclick: () => void;
};

export class CWAccountCreationButton extends ClassComponent<
  AccountCreationButtonAttrs
> {
  view(vnode: m.Vnode<AccountCreationButtonAttrs>) {
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
