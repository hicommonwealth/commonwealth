import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { Popover } from 'construct-ui';
import { ChainBase, ChainClass } from 'models';
import { formatCoin } from 'adapters/currency';
import User from 'views/components/widgets/user';
import { Balance } from '@polkadot/types/interfaces';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { IValidatorAttrs, ViewNominatorsModal } from '..';
import ImOnline from './im_online';
import Identity from './identity';

const PERBILL_PERCENT = 10_000_000;

export interface IValidatorState {
  dynamic: {
    query: DeriveStakingQuery;
    byAuthor: Record<string, string>;
  },
  isNominating: boolean;
}

export interface StakingState {
  commission?: string;
  nominators: [string, Balance][];
  stakeTotal?: BN;
  stakeOther?: BN;
  stakeOwn?: BN;
}

export function expandInfo({ exposure, validatorPrefs }: DeriveStakingQuery): StakingState {
  let nominators: [string, Balance][] = [];
  let stakeTotal: BN | undefined;
  let stakeOther: BN | undefined;
  let stakeOwn: BN | undefined;

  if (exposure) {
    nominators = exposure.others.map(({ value, who }): [string, Balance] => [who.toString(), value.unwrap()]);
    stakeTotal = exposure.total.unwrap();
    stakeOwn = exposure.own.unwrap();
    stakeOther = stakeTotal.sub(stakeOwn);
  }

  const commission = validatorPrefs?.commission?.unwrap();

  return {
    commission: commission
      ? `${(commission.toNumber() / PERBILL_PERCENT).toFixed(2)}%`
      : undefined,
    nominators,
    stakeOther,
    stakeOwn,
    stakeTotal
  };
}

const ValidatorRow = makeDynamicComponent<IValidatorAttrs, IValidatorState>({
  oninit: (vnode) => {
    vnode.state.isNominating = vnode.attrs.hasNominated;
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
  }),
  view: (vnode) => {
    const byAuthor = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.byAuthor
      : {};

    const nominatorsList = vnode.attrs.nominators;
    const commission = vnode.attrs.commission || 0;
    const apr = vnode.attrs?.apr || 0;

    return m('tr.ValidatorRow', [
      m('td.val-stash', m(Popover, {
        interactionType: 'hover',
        content: m(Identity, { stash: vnode.attrs.stash }),
        trigger: m('div', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }))
      })),
      m('td.val-total', [
        formatCoin(app.chain.chain.coins(vnode.attrs.total), true), ' '
      ]),
      // m('td.val-own', formatCoin(app.chain.chain.coins(vnode.attrs.bonded), true)),
      m('td.val-other', [
        formatCoin(app.chain.chain.coins(vnode.attrs.otherTotal), true),
        nominatorsList.length > 0 && [
          m('a.val-nominators.padding-left-2', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: ViewNominatorsModal,
                data: { nominators: nominatorsList, validatorAddr: vnode.attrs.stash }
              });
            }
          }, `(${nominatorsList.length})`)],
      ]),
      m('td.val-commission', `${commission.toFixed(2)}%`),
      m('th.val-rewards-slashes-offenses', false /* TODOO: integrate count for the heading herer */ || '11/10/12'),
      m('td.val-points', vnode.attrs.eraPoints || '0'),
      m('td.val-apr', `${apr.toFixed(2)}%`),
      // m('td.val-last-hash', byAuthor[vnode.attrs.stash] || ' '),
      m(ImOnline, {
        toBeElected: vnode.attrs.toBeElected,
        isOnline: vnode.attrs.isOnline,
        hasMessage: vnode.attrs.hasMessage,
        blockCount: vnode.attrs.blockCount
      })
    ]);
  }
});

export default ValidatorRow;
