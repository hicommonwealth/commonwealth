import React from 'react';

import { redraw } from 'mithrilInterop';
import $ from 'jquery';

import 'modals/select_address_modal.scss';

import app from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { isSameAccount, formatAsTitleCase } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { formatAddressShort } from '../../../../shared/utils';
import Account from '../../models/Account';
import RoleInfo from '../../models/RoleInfo';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { UserBlock } from '../components/user/user_block';
import { getClasses } from '../components/component_kit/helpers';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { openConfirmation } from 'views/modals/confirmation_modal';

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

    openConfirmation({
      title: 'Warning',
      description: <>Remove this address from the community?</>,
      buttons: [
        {
          label: 'Remove',
          buttonType: 'mini-red',
          onClick: () => {
            app.roles
              .deleteRole({
                address: addressInfo,
                chain: app.activeChainId(),
              })
              .then(() => {
                setIsLoading(false);
                setSelectedIndex(null);
                // unset activeAccount, or set it to the next activeAccount
                if (isSameAccount(app.user.activeAccount, account)) {
                  app.user.ephemerallySetActiveAccount(null);
                }
              })
              .catch((err: any) => {
                setIsLoading(false);
                notifyError(err.responseJSON.error);
              });
          },
        },
        {
          label: 'No',
          buttonType: 'mini-white',
          onClick: () => {
            setIsLoading(false);
          },
        },
      ],
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
