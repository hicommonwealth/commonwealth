/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import _ from 'lodash';

import 'pages/settings/linked_addresses_section.scss';

import app from 'state';
import { orderAccountsByAddress, link, formatAddressShort } from 'helpers';
import { unlinkLogin } from 'controllers/app/login';
import { AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { WalletId } from 'common-common/src/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type AccountRowAttrs = {
  account: AddressInfo;
  onClick?: (e: Event) => any;
};

class AccountRow extends ClassComponent<AccountRowAttrs> {
  private removing: boolean;

  view(vnode: ResultNode<AccountRowAttrs>) {
    const { account } = vnode.attrs;
    const isActiveAccount =
      app.user.activeAccount &&
      app.user.activeAccount.chain.id === account.chain.id &&
      app.user.activeAccount.address === account.address;

    return (
      <div
        className={getClasses<{ isSelected?: boolean }>(
          { isSelected: isActiveAccount },
          'AccountRow'
        )}
        key={`${account.chain.id}#${account.address}`}
        onClick={vnode.attrs.onClick}
      >
        {render(User, {
          user: account,
          avatarOnly: true,
          avatarSize: 32,
          linkify: true,
          popover: true,
        })}
        <div className="info-col">
          {render(User, {
            user: account,
            hideAvatar: true,
            linkify: true,
            popover: true,
          })}
          <CWText className="address-text" type="caption">
            {formatAddressShort(account.address)} -{' '}
            {app.config.chains.getById(account.chain.id)?.name}
          </CWText>
          {account.walletId === WalletId.Magic && (
            <CWText className="address-text" type="caption">
              Magically linked to {app.user.email}
            </CWText>
          )}
          {account instanceof MolochMember &&
            account.isMember &&
            account.delegateKey && (
              <CWText noWrap>
                Delegate:
                {account.isMember
                  ? link(
                      'a',
                      `/${account.chain.id}/account/${account.delegateKey}`,
                      account.delegateKey
                    )
                  : 'N/A'}
              </CWText>
            )}
        </div>
        <CWButton
          buttonType="primary-red"
          onClick={async () => {
            const confirmed = await confirmationModalWithText(
              'Are you sure you want to remove this account?'
            )();
            if (confirmed) {
              this.removing = true;
              if (
                app.user.activeAccount?.address === account.address &&
                app.user.activeAccount?.chain.id === account.chain.id
              ) {
                app.user.ephemerallySetActiveAccount(null);
              }
              unlinkLogin(account).then(() => {
                this.removing = false;
                redraw();
              });
            }
          }}
          disabled={
            this.removing ||
            app.user.addresses.some((a) => a.walletId === WalletId.Magic)
          }
          loading={this.removing}
          label="Remove"
        />
      </div>
    );
  }
}

export class LinkedAddressesSection extends ClassComponent {
  view() {
    const addressGroups = Object.entries(
      _.groupBy(app.user.addresses, (account) => account.chain.id)
    );

    return (
      <div className="LinkedAddressesSection">
        <CWText type="h5" fontWeight="semiBold">
          Linked addresses
        </CWText>
        {addressGroups.map(([chain_id, addresses]) =>
          addresses
            .sort(orderAccountsByAddress)
            .map((account) => render(AccountRow, { account }))
        )}
        {app.user.addresses.length === 0 && <CWText>No addresses</CWText>}
      </div>
    );
  }
}
