import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Tag, Button, Icon, Icons } from 'construct-ui';

import app from 'state';
import { Account, RoleInfo, ChainBase } from 'models';
import { UserBlock } from 'views/components/widgets/user';
import { articlize, isSameAccount, formatAsTitleCase } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import LoginWithWalletDropdown from 'views/components/login_with_wallet_dropdown';
import { formatAddressShort } from '../../../../shared/utils';

const SelectAddressModal: m.Component<{}, { selectedIndex: number, loading: boolean }> = {
  view: (vnode) => {
    const activeAccountsByRole: Array<[Account<any>, RoleInfo]> = app.user.getActiveAccountsByRole();
    const activeEntityInfo = app.community ? app.community.meta : app.chain?.meta?.chain;

    const createRole = (e) => {
      vnode.state.loading = true;

      const [account, role] = activeAccountsByRole[vnode.state.selectedIndex];
      const addressInfo = app.user.addresses
        .find((a) => a.address === account.address && a.chain === account.chain.id);
      app.user.createRole({
        address: addressInfo,
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      }).then(() => {
        vnode.state.loading = false;
        m.redraw();
        vnode.state.selectedIndex = null;
        // select the address, and close the form
        notifySuccess(`Joined with ${formatAddressShort(addressInfo.address, addressInfo.chain, true)}`);
        setActiveAccount(account).then(() => {
          m.redraw();
          $(e.target).trigger('modalexit');
        });
      }).catch((err: any) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    const deleteRole = async (index, e) => {
      vnode.state.loading = true;
      const [account, role] = activeAccountsByRole[index];
      const addressInfo = app.user.addresses
        .find((a) => a.address === account.address && a.chain === account.chain.id);

      // confirm
      const confirmed = await confirmationModalWithText('Remove this address from the community?')();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      app.user.deleteRole({
        address: addressInfo,
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      }).then(() => {
        vnode.state.loading = false;
        m.redraw();
        vnode.state.selectedIndex = null;
        // unset activeAccount, or set it to the next activeAccount
        if (isSameAccount(app.user.activeAccount, account)) {
          app.user.ephemerallySetActiveAccount(null);
        }
      }).catch((err: any) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    // const chainbase = (app.chain?.meta?.chain?.base.length != 0) ? app.chain?.meta?.chain?.base : ChainBase.Ethereum;

    return m('.SelectAddressModal', [
      m('.compact-modal-title', [
        m('h3', 'Manage addresses'),
      ]),
      m('.compact-modal-body', [
        activeAccountsByRole.length === 0 ? m('.select-address-placeholder', [
          m('p', [
            `Connect ${articlize(app.chain?.meta?.chain.name || 'Web3')} address to join this community. `,
          ]),
          m('p', [
            'Select a wallet below to continue:',
          ]),
        ]) : m('.select-address-options', [
          activeAccountsByRole.map(([account, role], index) => role && m('.select-address-option.existing', [
            m('.select-address-option-left', [
              m(UserBlock, { user: account }),
              app.user.addresses.find((a) => a.address === account.address && a.chain === account.chain.id)?.isMagic
                && m('.magic-label', `Magically linked to ${app.user.email}`),
            ]),
            m('.role-remove', [
              m('span.already-connected', `${formatAsTitleCase(role.permission)} of '${activeEntityInfo?.name}'`),
              m('span.icon', {
                onclick: deleteRole.bind(this, index)
              }, m(Icon, { name: Icons.X })),
            ]),
          ])),
          activeAccountsByRole.map(([account, role], index) => !role && m('.select-address-option', {
            class: vnode.state.selectedIndex === index ? 'selected' : '',
            onclick: async (e) => {
              e.preventDefault();
              vnode.state.selectedIndex = index;
            },
          }, [
            m('.select-address-option-left', [
              m(UserBlock, { user: account, showRole: true, selected: vnode.state.selectedIndex === index }),
              app.user.addresses.find((a) => a.address === account.address && a.chain === account.chain.id)?.isMagic
                && m('.magic-label', `Magically linked to ${app.user.email}`),
            ]),
            role && m('.role-permission', [
              m(Tag, { label: formatAsTitleCase(role.permission), rounded: true, size: 'sm' }),
              role.is_user_default && m(Tag, { label: 'Last used', rounded: true, size: 'sm' }),
            ]),
          ])),
        ]),
        activeAccountsByRole.length !== 0 && m(Button, {
          label: 'Join community with address',
          intent: 'primary',
          compact: true,
          fluid: true,
          rounded: true,
          disabled: vnode.state.selectedIndex === undefined || vnode.state.loading,
          onclick: createRole.bind(this),
        }),
        m(LoginWithWalletDropdown, {
          loggingInWithAddress: false,
          joiningCommunity: app.activeCommunityId(),
          joiningChain: app.activeChainId(),
          label: activeAccountsByRole.length !== 0 ? 'Connect a new address' : 'Connect address',
          onSuccess: () => {
            $('.SelectAddressModal').trigger('modalexit');
            notifySuccess('New address connected!');
          }
        }),
      ]),
    ]);
  }
};

export default SelectAddressModal;
