/* eslint-disable @typescript-eslint/ban-types */
import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Tag, Button } from 'construct-ui';

import app from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, RoleInfo } from 'models';
import { UserBlock } from 'views/components/widgets/user';
import { isSameAccount, formatAsTitleCase } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { formatAddressShort } from '../../../../shared/utils';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import  ClassComponent from 'class_component';

type SelectAddressModalProps = {

}

export class SelectAddressModal extends ClassComponent {
  private selectedIndex: number;
  private loading: boolean;
  private activeAccountsByRole: Array<[Account, RoleInfo]> 

  oninit() {
    this.activeAccountsByRole = app.roles.getActiveAccountsByRole();
  }

  view (vnode: m.Vnode<SelectAddressModalProps>) {
    const activeEntityInfo = app.chain?.meta;
    const createRole = (e) => {
      this.loading = true;

      const [account, role] = this.activeAccountsByRole[this.selectedIndex];
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
    },

    const deleteRole = async (index, e) => {
      this.loading = true;
      const [account, role] = this.activeAccountsByRole[index];
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
    }

    const chainbase = app.chain ? app.chain?.meta?.base : ChainBase.Ethereum;

    const activeCommunityMeta = app.chain.meta;
    const hasTermsOfService = !!activeCommunityMeta?.terms;

    return (
      <div class='SelectAddressModal'>
        <div class='.compact-modal-title'>
          <h3> Manage addresses </h3>
        </div>
        <div class='compact-modal-body'>
          {this.activeAccountsByRole === 0 ? (
            <div class='.select-address-placeholder'>
              <p>Connect{ chainbase && app.chain.network === ChainNetwork.Terra
                    ? 'Terra'
                    : chainbase
                    ? chainbase[0].toUpperCase() + chainbase.slice(1)
                    : 'Web3'
}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

