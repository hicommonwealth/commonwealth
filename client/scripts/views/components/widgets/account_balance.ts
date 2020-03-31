import 'components/widgets/account_balance.scss';

import { default as m } from 'mithril';
import { Coin, formatCoin } from 'adapters/currency';
import { SubstrateCoin } from 'shared/adapters/chain/substrate/types';
import { makeDynamicComponent } from 'models/mithril';
import { Account } from 'models/models';

import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { NearAccount } from 'controllers/chain/near/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

interface IProfileSummaryAttrs {
  account: Account<any>;
}

interface IProfileSummaryState {
  dynamic: {
    balance: Coin;
    lockedBalance?: SubstrateCoin;
    unlockedBalance?: SubstrateCoin;
    delegations?: number;
  };
}

const AccountBalance = makeDynamicComponent<IProfileSummaryAttrs, IProfileSummaryState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    balance: attrs.account.balance,
    lockedBalance: attrs.account instanceof SubstrateAccount ? attrs.account.reservedBalance : null,
    unlockedBalance: attrs.account instanceof SubstrateAccount ? attrs.account.freeBalance : null,
    delegations: attrs.account instanceof CosmosAccount ? attrs.account.delegations : null,
  }),
  view: (vnode) => {
    const isSubstrate = (vnode.attrs.account instanceof SubstrateAccount);
    const isCosmos = (vnode.attrs.account instanceof CosmosAccount);
    const isNear = (vnode.attrs.account instanceof NearAccount);
    const dynamic = vnode.state.dynamic;
    return m('.AccountBalance', [
      isNear && m('div.near-balance', [
        m('div.balance-type', [
          m('div.label', 'BALANCE'),
          m('div.balance', dynamic.balance !== undefined ?
            formatCoin(dynamic.balance) : '--')
        ]),
      ]),
      isSubstrate && [
        m('div.substrate-liquidity', [
          m('div.balance-type', [
            m('div.label', 'LIQUID'),
            m('div.balance', dynamic.unlockedBalance !== undefined ?
              formatCoin(dynamic.unlockedBalance) : '--')
          ]),
          m('div.balance-type', [
            m('div.label', 'ILLIQUID'),
            m('div.balance', dynamic.lockedBalance !== undefined ?
              formatCoin(dynamic.lockedBalance) : '--')
          ])
        ]),
        m('div.balance-type.controlling-row', [
          m('div.label', 'CONTROLLING'),
          m('div.balance', dynamic.balance !== undefined ?
            formatCoin(dynamic.balance) : '--')
        ])
      ],
      isCosmos && m('div.cosmos-balance', [
        m('div.balance-type', [
          m('div.label', 'LIQUID'),
          m('div.balance', dynamic.balance !== undefined ?
            formatCoin(dynamic.balance) : '--')
        ]),
        m('div.balance-type', [
          m('div.label', 'DELEGATORS'),
          m('div.balance', dynamic.delegations !== undefined ? dynamic.delegations : '--' )
        ])
      ]),
      m('a.btn', 'Manage Staking')
    ]);
  }
});

export default AccountBalance;
