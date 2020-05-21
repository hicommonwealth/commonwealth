import 'components/widgets/account_balance.scss';

import { BalanceLock, BalanceLockTo212 } from '@polkadot/types/interfaces';
import { default as m } from 'mithril';

import { Coin, formatCoin } from 'adapters/currency';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { makeDynamicComponent } from 'models/mithril';
import { Account } from 'models';

import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { NearAccount } from 'controllers/chain/near/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import MolochMember from 'controllers/chain/ethereum/moloch/member';

interface IProfileSummaryAttrs {
  account: Account<any>;
}

interface IProfileSummaryState {
  dynamic: {
    balance: Coin;
    lockedBalance?: SubstrateCoin;
    unlockedBalance?: SubstrateCoin;
    delegations?: number;
    locks?: (BalanceLock | BalanceLockTo212)[];
  };
}

const AccountBalance = makeDynamicComponent<IProfileSummaryAttrs, IProfileSummaryState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    balance: attrs.account.balance,
    lockedBalance: attrs.account instanceof SubstrateAccount ? attrs.account.lockedBalance : null,
    unlockedBalance: attrs.account instanceof SubstrateAccount ? attrs.account.freeBalance : null,
    locks: attrs.account instanceof SubstrateAccount ? attrs.account.locks : null,
    delegations: attrs.account instanceof CosmosAccount ? attrs.account.delegations : null,
  }),
  view: (vnode) => {
    const isSubstrate = (vnode.attrs.account instanceof SubstrateAccount);
    const isCosmos = (vnode.attrs.account instanceof CosmosAccount);
    const isNear = (vnode.attrs.account instanceof NearAccount);
    const isMoloch = (vnode.attrs.account instanceof MolochMember);
    const dynamic = vnode.state.dynamic;

    return m('.AccountBalance', [
      isNear && m('div.near-balance', [
        m('div.balance-type', [
          m('div.label', 'BALANCE'),
          m('div.balance', dynamic.balance !== undefined
            ? formatCoin(dynamic.balance) : '--')
        ]),
      ]),
      isMoloch && m('div.moloch-balance', [
        m('div.balance-type', [
          m('div.label', 'IS MEMBER'),
          m('div.balance', (vnode.attrs.account as MolochMember).isMember ? 'YES' : 'NO'),
        ]),
        m('div.balance-type', [
          m('div.label', 'SHARES'),
          // don't use denom label for share holdings -- should always be round number
          m('div.balance', dynamic.balance !== undefined
            ? `${dynamic.balance.toNumber()}` : '--')
        ]),
      ]),
      isSubstrate && [
        m('div.substrate-liquidity', [
          m('div.balance-type', [
            m('div.label', 'LIQUID'),
            m('div.balance', dynamic.unlockedBalance !== undefined
              ? formatCoin(dynamic.unlockedBalance) : '--')
          ]),
          m('div.balance-type', [
            m('div.label', 'ILLIQUID'),
            m('div.balance', dynamic.lockedBalance !== undefined
              ? formatCoin(dynamic.lockedBalance) : '--')
          ])
        ]),
        m('div.balance-type.controlling-row', [
          m('div.label', 'CONTROLLING'),
          m('div.balance', dynamic.balance !== undefined
            ? formatCoin(dynamic.balance) : '--')
        ])
      ],
      isCosmos && m('div.cosmos-balance', [
        m('div.balance-type', [
          m('div.label', 'LIQUID'),
          m('div.balance', dynamic.balance !== undefined
            ? formatCoin(dynamic.balance) : '--')
        ]),
        m('div.balance-type', [
          m('div.label', 'DELEGATORS'),
          m('div.balance', dynamic.delegations !== undefined ? dynamic.delegations : '--')
        ])
      ]),
      m('a.btn', 'Manage Staking')
    ]);
  }
});

export default AccountBalance;
