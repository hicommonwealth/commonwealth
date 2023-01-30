/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_account_creation_button.scss';
import { CWCard } from './cw_card';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';

import { ComponentType } from './types';

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
