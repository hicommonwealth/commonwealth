import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAsTitleCase, isSameAccount } from 'helpers';
import $ from 'jquery';

import { redraw } from 'mithrilInterop';

import 'modals/select_address_modal.scss';
import React from 'react';

import app from 'state';
import { formatAddressShort } from '../../../../shared/utils';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { getClasses } from '../components/component_kit/helpers';
import { UserBlock } from '../components/user/user_block';

type SelectAddressModalProps = {
  onModalClose: () => void;
};

export const SelectAddressModal = (props: SelectAddressModalProps) => {
  const { onModalClose } = props;

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const activeAccountsByRole: Array<[Account, RoleInfo]> =
    app.roles.getActiveAccountsByRole();

  const activeEntityInfo = app.chain?.meta;

  const createRole = (e) => {
    setIsLoading(true);

    const [account] = activeAccountsByRole[selectedIndex];

    const addressInfo = app.user.addresses.find(
      (a) => a.address === account.address && a.chain.id === account.chain.id
    );

    app.roles
      .createRole({
        address: addressInfo,
        chain: app.activeChainId(),
      })
      .then(() => {
        setIsLoading(false);
        redraw();
        setSelectedIndex(null);
        // select the address, and close the form
        notifySuccess(
          `Joined with ${formatAddressShort(
            addressInfo.address,
            addressInfo.chain.id,
            true
          )}`
        );
        setActiveAccount(account).then(() => {
          redraw();
          $(e.target).trigger('modalexit');
        });
      })
      .catch((err: any) => {
        setIsLoading(false);
        redraw();
        notifyError(err.responseJSON.error);
      });
  };

  const deleteRole = async (index) => {
    setIsLoading(true);

    const [account] = activeAccountsByRole[index];

    const addressInfo = app.user.addresses.find(
      (a) => a.address === account.address && a.chain.id === account.chain.id
    );

    // confirm
    const confirmed = window.confirm('Remove this address from the community?');

    if (!confirmed) {
      setIsLoading(false);
      redraw();
      return;
    }

    app.roles
      .deleteRole({
        address: addressInfo,
        chain: app.activeChainId(),
      })
      .then(() => {
        setIsLoading(false);
        redraw();
        setSelectedIndex(null);
        // unset activeAccount, or set it to the next activeAccount
        if (isSameAccount(app.user.activeAccount, account)) {
          app.user.ephemerallySetActiveAccount(null);
        }
      })
      .catch((err: any) => {
        setIsLoading(false);
        redraw();
        notifyError(err.responseJSON.error);
      });
  };

  const chainbase = app.chain ? app.chain?.meta?.base : ChainBase.Ethereum;

  const activeCommunityMeta = app.chain.meta;
  const hasTermsOfService = !!activeCommunityMeta?.terms;

  return (
    <div className="SelectAddressModal">
      <div className="compact-modal-title">
        <h3>Manage addresses</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        {activeAccountsByRole.length === 0 ? (
          <div className="select-address-placeholder">
            Connect{' '}
            {chainbase && app.chain.network === ChainNetwork.Terra
              ? 'Terra'
              : chainbase
              ? chainbase[0].toUpperCase() + chainbase.slice(1)
              : 'Web3'}{' '}
            address to join this community:
          </div>
        ) : (
          <div className="select-address-options">
            {activeAccountsByRole.map(
              ([account, role]) =>
                role && (
                  <div className="select-address-option existing">
                    <div className="select-address-option-left">
                      <UserBlock user={account} />
                      {app.user.addresses.find(
                        (a) =>
                          a.address === account.address &&
                          a.chain.id === account.chain.id
                      )?.walletId === WalletId.Magic && (
                        <div className="magic-label">
                          Magically linked to {app.user.email}
                        </div>
                      )}
                    </div>
                    <div className="role-remove">
                      <span className="already-connected">
                        {formatAsTitleCase(role.permission)} of{' '}
                        {activeEntityInfo?.name}
                      </span>
                      <CWIcon
                        iconName="close"
                        iconSize="small"
                        onClick={deleteRole.bind(this)}
                      />
                    </div>
                  </div>
                )
            )}
            {activeAccountsByRole.map(
              ([account, role], index) =>
                !role && (
                  <div
                    className={getClasses<{ isSelected: boolean }>(
                      { isSelected: selectedIndex === index },
                      'select-address-option'
                    )}
                    onClick={async (e) => {
                      e.preventDefault();
                      setSelectedIndex(index);
                    }}
                  >
                    <div className="select-address-option-left">
                      <UserBlock
                        user={account}
                        showRole
                        selected={selectedIndex === index}
                      />
                      {app.user.addresses.find(
                        (a) =>
                          a.address === account.address &&
                          a.chain.id === account.chain.id
                      )?.walletId === WalletId.Magic && (
                        <div className="magic-label">
                          Magically linked to {app.user.email}
                        </div>
                      )}
                    </div>
                    {role && (
                      <div className="role-permission">
                        <CWText className="role-tag">
                          {formatAsTitleCase(role.permission)}
                        </CWText>
                        {role.is_user_default && (
                          <CWText className="role-tag">Last used</CWText>
                        )}
                      </div>
                    )}
                  </div>
                )
            )}
          </div>
        )}
        {hasTermsOfService && (
          <div className="terms-of-service">
            By linking an address, you agree to ${activeCommunityMeta.name}'s{' '}
            <a href={activeCommunityMeta.terms} target="_blank">
              terms of service
            </a>
            .
          </div>
        )}
        {activeAccountsByRole.length !== 0 && (
          <CWButton
            label="Join community with address"
            disabled={typeof selectedIndex !== 'number' || isLoading}
            onClick={createRole.bind(this)}
          />
        )}
      </div>
    </div>
  );
};
