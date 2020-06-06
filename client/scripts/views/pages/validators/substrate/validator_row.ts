import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { ChainBase } from 'models';
import { pluralize } from 'helpers';
import { formatCoin } from 'adapters/currency';
import User from 'views/components/widgets/user';
import { Balance } from '@polkadot/types/interfaces';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { DeriveStakingQuery, DeriveAccountInfo } from '@polkadot/api-derive/types';
import { IValidatorAttrs, ViewNominatorsModal } from '..';
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

function expandInfo({ exposure, validatorPrefs }: DeriveStakingQuery): StakingState {
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
    // info: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.info(attrs.stash) : null,
    query: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.query(attrs.stash)
      : null
  }),
  view: (vnode) => {
    const { query } = vnode.state.dynamic;
    const byAuthor = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.byAuthor
      : {};
    const stakingInfo = query ? expandInfo(query) : null;
    const nominators = stakingInfo
      ? stakingInfo.nominators.map(([who, value]): any => ({ stash: who, balance: app.chain.chain.coins(value) }))
      : [];
    const nominatorsList = vnode.attrs.nominators.length
      ? vnode.attrs.nominators
      : nominators;
    return m('tr.ValidatorRow', [
      (!vnode.attrs.waiting
        && m('td.val-controller', m(User, { user: app.chain.accounts.get(vnode.attrs.controller), linkify: true }))
      ),
      m('td.val-stash', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true })),
      (vnode.attrs.waiting
        && m('td.val-nominations', [
          nominatorsList.length > 0 && [
            m('a.val-nominators', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: ViewNominatorsModal,
                  data: { nominators: nominatorsList, validatorAddr: vnode.attrs.stash }
                });
              }
            }, pluralize(nominatorsList.length, 'Nomination')),
          ]
        ])
      ),
      (!vnode.attrs.waiting
        && m('td.val-total', [
          formatCoin(vnode.attrs.total, true),
          ' ',
          nominatorsList.length > 0 && [
            '(',
            m('a.val-nominators', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: ViewNominatorsModal,
                  data: { nominators: nominatorsList, validatorAddr: vnode.attrs.stash }
                });
              }
            }, nominatorsList.length),
            ')',
          ],
        ])
      ),
      (!vnode.attrs.waiting
        && m('td.val-own', formatCoin(vnode.attrs.bonded, true))
      ),
      (!vnode.attrs.waiting
        && m('td.val-own', formatCoin(vnode.attrs.nominated, true))
      ),
      m('td.val-commission', stakingInfo?.commission || ' '),
      (!vnode.attrs.waiting
        && m('td.val-points', vnode.attrs.eraPoints || ' ')
      ),
      (!vnode.attrs.waiting
        && m('td.val-last-hash', byAuthor[vnode.attrs.stash] || ' ')
      ),
      (vnode.attrs.waiting
        && m('td.val-points', vnode.attrs.toBeElected
          ? 'PolkadotJS'
          : '')
      ),
      // m('td.val-action', [
      //   m('button.view-validator.formular-button-primary', {
      //     onclick: (e) => {
      //       e.preventDefault();
      //     }
      //   }, 'View'),
      // ]),
    ]);
  }
});

export default ValidatorRow;
