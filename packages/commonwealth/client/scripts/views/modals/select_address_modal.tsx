/* @jsx m */

import ClassComponent from 'class_component';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAsTitleCase, isSameAccount } from 'helpers';
import $ from 'jquery';
import m from 'mithril';

import 'modals/select_address_modal.scss';
import type { RoleInfo } from 'models';

import app from 'state';
import { UserBlock } from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { formatAddressShort } from '../../../../shared/utils';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';
import { getClasses } from '../components/component_kit/helpers';
import AddressAccount from 'models/AddressAccount';

export class SelectAddressModal extends ClassComponent {
  private loading: boolean;
  private selectedIndex: number;

  view() {
    const activeAccountsByRole: Array<[AddressAccount, RoleInfo]> =
      app.roles.getActiveAccountsByRole();

    const activeEntityInfo = app.chain?.meta;

    const createRole = (e) => {
      this.loading = true;

      const [account] = activeAccountsByRole[this.selectedIndex];

      const addressAccount = app.user.addresses.find(
        (a) => a.address === account.address && a.chain.id === account.chain.id
      );

      app.roles
        .createRole({
          address: addressAccount,
          chain: app.activeChainId(),
        })
        .then(() => {
          this.loading = false;
          m.redraw();
          this.selectedIndex = null;
          // select the address, and close the form
          notifySuccess(
            `Joined with ${formatAddressShort(
              addressAccount.address,
              addressAccount.chain.id,
              true
            )}`
          );
          setActiveAccount(account).then(() => {
            m.redraw();
            $(e.target).trigger('modalexit');
          });
        })
        .catch((err: any) => {
          this.loading = false;
          m.redraw();
          notifyError(err.responseJSON.error);
        });
    };

    const deleteRole = async (index) => {
      this.loading = true;

      const [account] = activeAccountsByRole[index];

      const addressAccount = app.user.addresses.find(
        (a) => a.address === account.address && a.chain.id === account.chain.id
      );

      // confirm
      const confirmed = await confirmationModalWithText(
        'Remove this address from the community?'
      )();

      if (!confirmed) {
        this.loading = false;
        m.redraw();
        return;
      }

      app.roles
        .deleteRole({
          address: addressAccount,
          chain: app.activeChainId(),
        })
        .then(() => {
          this.loading = false;
          m.redraw();
          this.selectedIndex = null;
          // unset activeAccount, or set it to the next activeAccount
          if (isSameAccount(app.user.activeAddressAccount, account)) {
            app.user.ephemerallySetActiveAccount(null);
          }
        })
        .catch((err: any) => {
          this.loading = false;
          m.redraw();
          notifyError(err.responseJSON.error);
        });
    };

    const chainbase = app.chain ? app.chain?.meta?.base : ChainBase.Ethereum;

    const activeCommunityMeta = app.chain.meta;
    const hasTermsOfService = !!activeCommunityMeta?.terms;

    return (
      <div class="SelectAddressModal">
        <div class="compact-modal-title">
          <h3>Manage addresses</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          {activeAccountsByRole.length === 0 ? (
            <div class="select-address-placeholder">
              Connect{' '}
              {chainbase && app.chain.network === ChainNetwork.Terra
                ? 'Terra'
                : chainbase
                ? chainbase[0].toUpperCase() + chainbase.slice(1)
                : 'Web3'}{' '}
              address to join this community:
            </div>
          ) : (
            <div class="select-address-options">
              {activeAccountsByRole.map(
                ([account, role]) =>
                  role && (
                    <div class="select-address-option existing">
                      <div class="select-address-option-left">
                        {m(UserBlock, { user: account })}
                        {app.user.addresses.find(
                          (a) =>
                            a.address === account.address &&
                            a.chain.id === account.chain.id
                        )?.walletId === WalletId.Magic && (
                          <div class="magic-label">
                            Magically linked to {app.user.email}
                          </div>
                        )}
                      </div>
                      <div class="role-remove">
                        <span class="already-connected">
                          {formatAsTitleCase(role.permission)} of{' '}
                          {activeEntityInfo?.name}
                        </span>
                        <CWIcon
                          iconName="close"
                          iconSize="small"
                          onclick={deleteRole.bind(this)}
                        />
                      </div>
                    </div>
                  )
              )}
              {activeAccountsByRole.map(
                ([account, role], index) =>
                  !role && (
                    <div
                      class={getClasses<{ isSelected: boolean }>(
                        { isSelected: this.selectedIndex === index },
                        'select-address-option'
                      )}
                      onclick={async (e) => {
                        e.preventDefault();
                        this.selectedIndex = index;
                      }}
                    >
                      <div class="select-address-option-left">
                        {m(UserBlock, {
                          user: account,
                          showRole: true,
                          selected: this.selectedIndex === index,
                        })}
                        {app.user.addresses.find(
                          (a) =>
                            a.address === account.address &&
                            a.chain.id === account.chain.id
                        )?.walletId === WalletId.Magic && (
                          <div class="magic-label">
                            Magically linked to {app.user.email}
                          </div>
                        )}
                      </div>
                      {role && (
                        <div class="role-permission">
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
            <div class="terms-of-service">
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
              onclick={createRole.bind(this)}
            />
          )}
        </div>
      </div>
    );
  }
}
