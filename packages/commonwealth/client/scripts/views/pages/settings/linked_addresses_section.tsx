/* @jsx m */

import ClassComponent from 'class_component';
import { WalletId } from 'common-common/src/types';
import { unlinkLogin } from 'controllers/app/login';
import { formatAddressShort, link, orderAccountsByAddress } from 'helpers';
import _ from 'lodash';
import m from 'mithril';

import 'pages/settings/linked_addresses_section.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import AddressAccount from "models/AddressAccount";

type AccountRowAttrs = {
  account: AddressAccount;
  onclick?: (e: Event) => any;
};

class AccountRow extends ClassComponent<AccountRowAttrs> {
  private removing: boolean;

  view(vnode: m.Vnode<AccountRowAttrs>) {
    const { account } = vnode.attrs;
    const isActiveAccount =
      app.user.activeAddressAccount &&
      app.user.activeAddressAccount.chain.id === account.chain.id &&
      app.user.activeAddressAccount.address === account.address;

    return (
      <div
        class={getClasses<{ isSelected?: boolean }>(
          { isSelected: isActiveAccount },
          'AccountRow'
        )}
        key={`${account.chain.id}#${account.address}`}
        onclick={vnode.attrs.onclick}
      >
        {m(User, {
          user: account,
          avatarOnly: true,
          avatarSize: 32,
          linkify: true,
          popover: true,
        })}
        <div class="info-col">
          {m(User, {
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
        </div>
        <CWButton
          buttonType="primary-red"
          onclick={async () => {
            const confirmed = await confirmationModalWithText(
              'Are you sure you want to remove this account?'
            )();
            if (confirmed) {
              this.removing = true;
              if (
                app.user.activeAddressAccount?.address === account.address &&
                app.user.activeAddressAccount?.chain.id === account.chain.id
              ) {
                app.user.ephemerallySetActiveAccount(null);
              }
              unlinkLogin(account).then(() => {
                this.removing = false;
                m.redraw();
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
      <div class="LinkedAddressesSection">
        <CWText type="h5" fontWeight="semiBold">
          Linked addresses
        </CWText>
        {addressGroups.map(([chain_id, addresses]) =>
          addresses
            .sort(orderAccountsByAddress)
            .map((account) => m(AccountRow, { account }))
        )}
        {app.user.addresses.length === 0 && <CWText>No addresses</CWText>}
      </div>
    );
  }
}
