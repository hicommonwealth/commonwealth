import React, { useState } from 'react';
import _ from 'lodash';

import 'pages/settings/linked_addresses_section.scss';

import { WalletId } from 'common-common/src/types';
import { unlinkLogin } from 'controllers/app/login';
import { formatAddressShort, orderAccountsByAddress } from 'helpers';
import type { AddressInfo } from 'models';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type AccountRowProps = {
  account: AddressInfo;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => any;
};

export const AccountRow = (props: AccountRowProps) => {
  const { account, onClick } = props;

  const [isRemoving, setIsRemoving] = useState(false);

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
      onClick={onClick}
    >
      <User user={account} avatarOnly avatarSize={32} linkify popover />
      <div className="info-col">
        <User user={account} hideAvatar linkify popover />
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
        onClick={async () => {
          const confirmed = window.confirm(
            'Are you sure you want to remove this account?'
          );
          if (confirmed) {
            setIsRemoving(true);
            if (
              app.user.activeAccount?.address === account.address &&
              app.user.activeAccount?.chain.id === account.chain.id
            ) {
              app.user.ephemerallySetActiveAccount(null);
            }
            unlinkLogin(account).then(() => {
              setIsRemoving(false);
            });
          }
        }}
        disabled={
          isRemoving ||
          app.user.addresses.some((a) => a.walletId === WalletId.Magic)
        }
        label="Remove"
      />
    </div>
  );
};

export const LinkedAddressesSection = () => {
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
          .map((account) => <AccountRow account={account} />)
      )}
      {app.user.addresses.length === 0 && <CWText>No addresses</CWText>}
    </div>
  );
};
