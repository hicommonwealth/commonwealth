import 'modals/select_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import ProfileBlock from 'views/components/widgets/profile_block';
import User from 'views/components/widgets/user';
import { isSameAccount } from 'helpers';
import { setActiveAccount } from 'controllers/app/login';

const SelectAddressOption: m.Component<{ account }> = {
  view: (vnode: m.VnodeDOM<{ account }>) => {
    const account = vnode.attrs.account;

    return m('.SelectAddressOption', {
      key: `${account.chain.id}-${account.address}`,
      class: isSameAccount(app.vm.activeAccount, account) ? 'selected' : '',
      onclick: async (e) => {
        e.preventDefault();
        await setActiveAccount(account);
        $(vnode.dom).trigger('modalexit');
      },
    }, [
      m(ProfileBlock, { account }),
    ]);
  }
};

const SelectAddressModal = {
  view: (vnode) => {
    return m('.SelectAddressModal', [
      m('.compact-modal-title', [
        m('h3', 'Select address'),
      ]),
      m('.compact-modal-body', [
        m('.modal-header', 'You have multiple addresses to use with this community. Select one to log in:'),
        app.login.activeAddresses.map((account) => {
          return m(SelectAddressOption, { account });
        }),
      ]),
    ]);
  }
};

export default SelectAddressModal;
