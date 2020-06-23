import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { Tooltip } from 'construct-ui';
import { ChainBase } from 'models';
import { formatCoin } from 'adapters/currency';
import User from 'views/components/widgets/user';
import { Balance } from '@polkadot/types/interfaces';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { IAccountInfo } from 'controllers/chain/substrate/staking';
import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { IValidatorAttrs, ViewNominatorsModal } from '..';
import ImOnline from './im_online';
import Identity from './identity';

const PERBILL_PERCENT = 10_000_000;

export interface IValidatorState {
  dynamic: {
    info: IAccountInfo;
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
    // info: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.info(attrs.stash) : null,
    query: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.query(attrs.stash)
      : null,
    info: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.info(attrs.stash)
      : null
  }),
  view: (vnode) => {
    const { query, info } = vnode.state.dynamic;
    const byAuthor = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.byAuthor
      : {};
    const stakingInfo = query
      ? expandInfo(query)
      : null;
    const nominatorsList = vnode.attrs.nominators;
    return m('tr.ValidatorRow', [
      m('td.val-controller', m(User, { user: app.chain.accounts.get(vnode.attrs.controller), linkify: true })),
      m('td.val-stash', m(Tooltip, { content: m(Identity, { ...info }),
        trigger: m('div', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }))
      })),
      m('td.val-total', [
        formatCoin(app.chain.chain.coins(stakingInfo?.stakeTotal), true), ' ',
        nominatorsList.length > 0 && [ '(',
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
          ')'],
      ]),
      m('td.val-own', formatCoin(app.chain.chain.coins(stakingInfo?.stakeOwn), true)),
      m('td.val-other', formatCoin(app.chain.chain.coins(stakingInfo?.stakeOther), true)),
      m('td.val-commission', stakingInfo?.commission || ' '),
      m('td.val-points', vnode.attrs.eraPoints || ' '),
      m('td.val-last-hash', byAuthor[vnode.attrs.stash] || ' '),
      m(ImOnline, {
        toBeElected: vnode.attrs.toBeElected,
        isOnline: vnode.attrs.isOnline,
        hasMessage: vnode.attrs.hasMessage,
        blockCount: vnode.attrs.blockCount
      })
      // m('td.val-age', '--'),
      // m('td.val-action', [
      //   m('button.nominate-validator.formular-button-primary', {
      //     class: app.user.activeAccount ? '' : 'disabled',
      //     onclick: (e) => {
      //       e.preventDefault();
      //       vnode.state.isNominating = !vnode.state.isNominating;
      //       vnode.attrs.onChangeHandler(vnode.attrs.stash);
      //     }
      //   }, vnode.state.isNominating ? 'Un-Nominate' : 'Nominate'),
      // ]),
    ]);
  }
});

export default ValidatorRow;
