import app from 'state';
import m from 'mithril';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import BN from 'bn.js';

interface FormatBalanceState {
    dynamic: {
        allBalances: DeriveBalancesAll
    }
}

interface FormatBalanceAttrs {
    controller: SubstrateAccount
}

const FormatBalance = makeDynamicComponent<FormatBalanceAttrs, FormatBalanceState>({
  getObservables: (attrs) => ({
    groupKey:  attrs.controller.profile.address,
    allBalances: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.allBalances(attrs.controller.profile.address)
      : null
  }),
  view: (vnode) => {
    const { allBalances } = vnode.state.dynamic;
    const balanceBN = new BN(allBalances?.freeBalance);
    const balance = (app.chain as Substrate).chain.coins(balanceBN);
    return m('p.balance', balance.format(true));
  }
});

export default FormatBalance;
