import 'modals/addresses_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { default as app } from 'state';

import { selectLogin } from 'controllers/app/login';
import { orderAccountsByAddress } from 'helpers';

import ProfileBlock from 'views/components/widgets/profile_block';
import { CompactModalExitButton } from 'views/modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';

const SwitchAddress = {
  view: (vnode) => {
    const account = vnode.attrs.account;
    const activeAccount = app.vm.activeAccount;

    return m('.SwitchAddress.account-menu-item', {
      key: `${account.chain.id}-${account.address}`,
      class: account === activeAccount ? 'active' : '',
      onclick: async (e) => {
        e.preventDefault();
        await selectLogin(account);
        $(vnode.dom).trigger('modalexit');
      },
    }, [
      m(ProfileBlock, { account, linkify: false, showBalance: true }),
    ]);
  }
};

const AddressesModal = {
  view: (vnode) => {
    const addresses = (app.login.activeAddresses || [])
      .sort(orderAccountsByAddress)
      .map((account) => m(SwitchAddress, { account }));

    return m('.AddressesModal', [
      m('.compact-modal-title', [
        m('h3', 'Switch address'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        addresses,
        addresses.length === 0 &&
          m('.no-accounts', `No ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} addresses`),
        m('a.btn.formular-button-primary.add-account', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalexit');
            app.modals.create({ modal: LinkNewAddressModal });
          }
        }, `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`),
      ]),
    ]);
  }
};

export default AddressesModal;
