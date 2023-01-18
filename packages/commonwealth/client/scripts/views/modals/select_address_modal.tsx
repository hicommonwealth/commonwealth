/* @jsx m */

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
import $ from 'jquery';

import 'modals/select_address_modal.scss';

import app from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, RoleInfo } from 'models';
import { isSameAccount, formatAsTitleCase } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { formatAddressShort } from '../../../../shared/utils';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWButton } from '../components/component_kit/cw_button';
import { getClasses } from '../components/component_kit/helpers';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { UserBlock } from '../components/user/user_block';

export class SelectAddressModal extends ClassComponent {
  private loading: boolean;
  private selectedIndex: number;

  view() {
    const activeAccountsByRole: Array<[Account, RoleInfo]> =
      app.roles.getActiveAccountsByRole();

    const activeEntityInfo = app.chain?.meta;

    const createRole = (e) => {
      this.loading = true;

      const [account] = activeAccountsByRole[this.selectedIndex];

      const addressInfo = app.user.addresses.find(
        (a) => a.address === account.address && a.chain.id === account.chain.id
      );

      app.roles
        .createRole({
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          this.loading = false;
          redraw();
          this.selectedIndex = null;
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
          this.loading = false;
          redraw();
          notifyError(err.responseJSON.error);
        });
    };

    const deleteRole = async (index) => {
      this.loading = true;

      const [account] = activeAccountsByRole[index];

      const addressInfo = app.user.addresses.find(
        (a) => a.address === account.address && a.chain.id === account.chain.id
      );

      // confirm
      const confirmed = await confirmationModalWithText(
        'Remove this address from the community?'
      )();

      if (!confirmed) {
        this.loading = false;
        redraw();
        return;
      }

      app.roles
        .deleteRole({
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          this.loading = false;
          redraw();
          this.selectedIndex = null;
          // unset activeAccount, or set it to the next activeAccount
          if (isSameAccount(app.user.activeAccount, account)) {
            app.user.ephemerallySetActiveAccount(null);
          }
        })
        .catch((err: any) => {
          this.loading = false;
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
          <ModalExitButton />
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
                        { isSelected: this.selectedIndex === index },
                        'select-address-option'
                      )}
                      onClick={async (e) => {
                        e.preventDefault();
                        this.selectedIndex = index;
                      }}
                    >
                      <div className="select-address-option-left">
                        <UserBlock
                          user={account}
                          showRole
                          selected={this.selectedIndex === index}
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
              disabled={typeof this.selectedIndex !== 'number' || this.loading}
              onClick={createRole.bind(this)}
            />
          )}
        </div>
      </div>
    );
  }
}
