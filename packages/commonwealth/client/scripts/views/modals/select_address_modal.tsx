/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
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
import { UserBlock } from '../components/widgets/user_block';

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
          m.redraw();
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

      const addressInfo = app.user.addresses.find(
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
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          this.loading = false;
          m.redraw();
          this.selectedIndex = null;
          // unset activeAccount, or set it to the next activeAccount
          if (isSameAccount(app.user.activeAccount, account)) {
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
                        <UserBlock user={account} />
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
