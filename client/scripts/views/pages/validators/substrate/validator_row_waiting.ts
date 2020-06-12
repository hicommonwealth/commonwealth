import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { ChainBase } from 'models';
import { pluralize } from 'helpers';
import User from 'views/components/widgets/user';
import { Balance } from '@polkadot/types/interfaces';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { DeriveStakingQuery, DeriveAccountInfo } from '@polkadot/api-derive/types';
import { IValidatorAttrs, ViewNominatorsModal } from '..';
import { expandInfo } from './validator_row';
import ImOnline from './im_online';

const PERBILL_PERCENT = 10_000_000;

interface IValidatorState {
  dynamic: {
    info: DeriveAccountInfo;
    query: DeriveStakingQuery;
    byAuthor: Record<string, string>;
  },
  isNominating: boolean;
}

interface StakingState {
  commission?: string;
  nominators: [string, Balance][];
  stakeTotal?: BN;
  stakeOther?: BN;
  stakeOwn?: BN;
}

const ValidatorRowWaiting = makeDynamicComponent<IValidatorAttrs, IValidatorState>({
  oninit: (vnode) => {
    vnode.state.isNominating = vnode.attrs.hasNominated;
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    // info: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.info(attrs.stash) : null,
    query: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.query(attrs.stash)
      : null
  }),
  view: (vnode) => {
    const { query } = vnode.state.dynamic;
    if (!query)
      return null;
    const nominations = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.nominations
      : {};
    const stakingInfo = query
      ? expandInfo(query)
      : null;
    const nominatorsList = nominations[vnode.attrs.stash] || [];
    return m('tr.ValidatorRow', [
      m('td.val-stash', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true })),
      m('td.val-nominations', [
        nominatorsList.length > 0 && [
          m('a.val-nominators', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: ViewNominatorsModal,
                data: { nominators: nominatorsList, validatorAddr: vnode.attrs.stash, waiting: true }
              });
            }
          }, pluralize(nominatorsList.length, 'Nomination')),
        ]
      ]),
      m('td.val-commission', stakingInfo?.commission || ' '),
      m(ImOnline, {
        toBeElected: vnode.attrs.toBeElected,
        isOnline: vnode.attrs.isOnline,
        hasMessage: vnode.attrs.hasMessage,
        blockCount: vnode.attrs.blockCount
      })
    ]);
  }
});

export default ValidatorRowWaiting;
