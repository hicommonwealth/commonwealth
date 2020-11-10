import m from 'mithril';

import { formatCoin } from 'adapters/currency';
import app from 'state';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { makeDynamicComponent } from 'models/mithril';

interface IState {
  dynamic: { freeBalance, lockedBalance, balance }
}

const BalanceInfo = makeDynamicComponent<{ account }, IState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    freeBalance: (attrs.account as SubstrateAccount).freeBalance,
    lockedBalance: (attrs.account as SubstrateAccount).lockedBalance,
    balance: (attrs.account as SubstrateAccount).balance,
  }),
  view: (vnode) => {
    return m('p.BalanceInfo', { style: 'font-size: 90%; line-height: 1.3;' }, [
      m('div', [
        'Free: ',
        vnode.state.dynamic?.freeBalance ? formatCoin(vnode.state.dynamic?.freeBalance) : '--',
      ]),
      m('div', [
        'Locked: ',
        vnode.state.dynamic?.lockedBalance ? formatCoin(vnode.state.dynamic?.lockedBalance) : '--',
      ]),
      m('div', [
        'Total: ',
        vnode.state.dynamic?.balance ? formatCoin(vnode.state.dynamic?.balance) : '--',
      ]),
    ]);
  }
});

export default BalanceInfo;
