import m from 'mithril';

import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import AccountsWell from 'views/components/settings/accounts_well';
import NewEVMContractModal from 'views/modals/evm_contract_modal';
import DepositeEVMBalanceModal from 'views/modals/evm_deposit_balance';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

interface IAttrs {
  account;
}

interface IState {
  dynamic: {
    evmAccount: any;
  };
}

const SubstrateEVMSidebar = makeDynamicComponent<IAttrs, IState>({
  getObservables: (attrs: IAttrs) => {
    return {
      groupKey: (attrs.account) ? attrs.account.address : null,
      evmAccount: (attrs.account) ? attrs.account.evmAccount : null,
    };
  },
  view: (vnode) => {
    const account = vnode.attrs.account;
    return [
      m(AccountsWell, {
        addresses: app.login.activeAddresses,
        hasAction: false,
        isEVM: true,
      }),
      m('.AccountsWell', [
        m('h4', 'Deploy EVM contract'),
        m('.address-listing-explanation', 'Deploy a contract from your EVM account'),
        m('.preheader-item-text', [
          m('a.btn.formular-button-primary', {
            class: app.vm.activeAccount ? '' : 'disabled',
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: NewEVMContractModal,
                data: { account }
              });
            }
          }, 'Deploy New Contract'),
        ]),
      ]),
      m('.forum-container.stats-tile', [
        m('.stats-tile-label', 'Balance'),
        m('.stats-tile-figure-major', app.chain &&
          `${(vnode.state.dynamic.evmAccount)
            ? vnode.state.dynamic.evmAccount['balance']
            : '--'}`),
      ]),
      m('.AccountsWell', [
        m('h4', 'Deposit balance'),
        m('.address-listing-explanation', 'Deposit an amount into your EVM account'),
        m('.preheader-item-text', [
          m('a.btn.formular-button-primary', {
            class: app.vm.activeAccount ? '' : 'disabled',
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: DepositeEVMBalanceModal,
                data: { account }
              });
            }
          }, 'Deposit'),
        ]),
      ]),
    ];
  }
});

export default SubstrateEVMSidebar;
