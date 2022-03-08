import 'components/widgets/account_balance.scss';

import { BalanceLock, BalanceLockTo212 } from '@polkadot/types/interfaces';
import m from 'mithril';

import { Coin, formatCoin } from 'adapters/currency';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { Account } from 'models';

import CosmosAccount from 'controllers/chain/cosmos/account';
import { NearAccount } from 'controllers/chain/near/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import app from 'state';

interface IProfileSummaryAttrs {
  account: Account<any>;
}

interface IProfileSummaryState {
  balance: Coin;
  lockedBalance?: SubstrateCoin;
  unlockedBalance?: SubstrateCoin;
  // TODO: wrong type for delegations
  // delegations?: number;
  locks?: (BalanceLock | BalanceLockTo212)[];
}

const AccountBalance = {
  oninit: (vnode: m.VnodeDOM<IProfileSummaryAttrs, IProfileSummaryState>) => {
    app.runWhenReady(async () => {
      vnode.state.balance = await vnode.attrs.account.balance;
      vnode.state.lockedBalance =
        vnode.attrs.account instanceof SubstrateAccount
          ? await vnode.attrs.account.lockedBalance
          : null;
      vnode.state.unlockedBalance =
        vnode.attrs.account instanceof SubstrateAccount
          ? await vnode.attrs.account.freeBalance
          : null;
      vnode.state.locks =
        vnode.attrs.account instanceof SubstrateAccount
          ? await vnode.attrs.account.locks
          : null;
      // vnode.state.delegations = vnode.attrs.account instanceof CosmosAccount
      //   ? await vnode.attrs.account.delegations
      //   : null;
      m.redraw();
    });
  },
  view: (vnode) => {
    const isSubstrate = vnode.attrs.account instanceof SubstrateAccount;
    const isCosmos = vnode.attrs.account instanceof CosmosAccount;
    const isNear = vnode.attrs.account instanceof NearAccount;
    const isMoloch = vnode.attrs.account instanceof MolochMember;
    const state = vnode.state;

    return m('.AccountBalance', [
      isNear &&
        m('div.near-balance', [
          m('div.balance-type', [
            m('div.label', 'BALANCE'),
            m(
              'div.balance',
              state.balance !== undefined ? formatCoin(state.balance) : '--'
            ),
          ]),
        ]),
      isMoloch &&
        m('div.moloch-balance', [
          m('div.balance-type', [
            m('div.label', 'IS MEMBER'),
            m(
              'div.balance',
              (vnode.attrs.account as MolochMember).isMember ? 'YES' : 'NO'
            ),
          ]),
          m('div.balance-type', [
            m('div.label', 'SHARES'),
            // don't use denom label for share holdings -- should always be round number
            m(
              'div.balance',
              state.balance !== undefined ? `${state.balance.toNumber()}` : '--'
            ),
          ]),
        ]),
      isSubstrate && [
        m('div.substrate-liquidity', [
          m('div.balance-type', [
            m('div.label', 'LIQUID'),
            m(
              'div.balance',
              state.unlockedBalance !== undefined
                ? formatCoin(state.unlockedBalance)
                : '--'
            ),
          ]),
          m('div.balance-type', [
            m('div.label', 'ILLIQUID'),
            m(
              'div.balance',
              state.lockedBalance !== undefined
                ? formatCoin(state.lockedBalance)
                : '--'
            ),
          ]),
        ]),
        m('div.balance-type.controlling-row', [
          m('div.label', 'CONTROLLING'),
          m(
            'div.balance',
            state.balance !== undefined ? formatCoin(state.balance) : '--'
          ),
        ]),
      ],
      isCosmos &&
        m('div.cosmos-balance', [
          m('div.balance-type', [
            m('div.label', 'LIQUID'),
            m(
              'div.balance',
              state.balance !== undefined ? formatCoin(state.balance) : '--'
            ),
          ]),
          // m('div.balance-type', [
          //   m('div.label', 'DELEGATORS'),
          //   m('div.balance', state.delegations !== undefined ? state.delegations : '--')
          // ])
        ]),
      m('a.btn', 'Manage Staking'),
    ]);
  },
};

export default AccountBalance;
