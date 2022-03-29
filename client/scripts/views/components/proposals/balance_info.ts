import m from 'mithril';

import { formatCoin } from 'adapters/currency';
import app from 'state';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

interface IState {
  freeBalance;
  lockedBalance;
  balance;
}

const BalanceInfo = {
  oninit: (vnode: m.Vnode<any, IState>) => {
    app.runWhenReady(async () => {
      vnode.state.freeBalance = await (vnode.attrs.account as SubstrateAccount)
        .freeBalance;
      vnode.state.lockedBalance = await (
        vnode.attrs.account as SubstrateAccount
      ).lockedBalance;
      vnode.state.balance = await (vnode.attrs.account as SubstrateAccount)
        .balance;
      m.redraw();
    });
  },
  view: (vnode) => {
    return m('.BalanceInfo', { style: 'font-size: 90%;' }, [
      m('div', [
        'Free: ',
        vnode.state.freeBalance ? formatCoin(vnode.state.freeBalance) : '--',
      ]),
      m('div', [
        'Locked: ',
        vnode.state.lockedBalance
          ? formatCoin(vnode.state.lockedBalance)
          : '--',
      ]),
      m('div', [
        'Total: ',
        vnode.state.balance ? formatCoin(vnode.state.balance) : '--',
      ]),
    ]);
  },
};

export default BalanceInfo;
