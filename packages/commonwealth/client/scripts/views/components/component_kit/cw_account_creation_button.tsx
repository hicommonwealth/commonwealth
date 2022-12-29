/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_account_creation_button.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCard } from './cw_card';
import { CWText } from './cw_text';

type AccountCreationButtonAttrs = {
  creationType?: 'newAccount' | 'linkAccount';
  onClick: () => void;
};

export class CWAccountCreationButton extends ClassComponent<AccountCreationButtonAttrs> {
  view(vnode: ResultNode<AccountCreationButtonAttrs>) {
    const { creationType = 'newAccount', onClick } = vnode.attrs;

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
  }
}
