import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { get } from 'lodash';
import BN from 'bn.js';
import { Icon, Icons, Spinner, ListItem, Select, Input, InputSelect } from 'construct-ui';

import { formatNumber } from '@polkadot/util';

import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import StakingController from 'controllers/server/staking';
import Tabs from 'views/components/widgets/tabs';

import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';

const pageSize = 20;

const model = {
  selectedState: 0,
  sortKey: '',
  sortAsc: true,
  activeVisibleCount: pageSize,
  waitingVisibleCount: pageSize,
  busyFetchingData: false,
  searchInput: '',
  sortIcon(key: string) {
    return model.sortKey === key
      ? model.sortAsc
        ? Icons.ARROW_UP
        : Icons.ARROW_DOWN
      : Icons.MINUS;
  },
  changeSort(key: string) {
    if (key === model.sortKey)
      model.sortAsc = !model.sortAsc;
    model.sortKey = key;
    m.redraw();
  }
};

const fetchMissingDataForVisibleRecord = async (state: string, validators: any[], stkcon: StakingController) => {
  if (!model.busyFetchingData) {
    model.busyFetchingData = true;
    m.redraw();
    const _toFetch = validators.filter((v) => v.visible && !v.dataFetched).map((v) => v.address);
    if (_toFetch.length > 0) {
      const res = await stkcon.validatorDetail(state, _toFetch) as any;
      res.validators.forEach((q) => {
        const _v = validators.findIndex((v) => v.address === q.stash);
        if (_v > -1) {
          if (q.HistoricalValidatorStatistics[0].exposure?.total) {
            q.HistoricalValidatorStatistics[0].exposure.total = (Number(q.HistoricalValidatorStatistics[0].exposure?.total));
          }
          if (q.HistoricalValidatorStatistics[0].exposure?.own) {
            q.HistoricalValidatorStatistics[0].exposure.own = Number(q.HistoricalValidatorStatistics[0].exposure?.own);
          }
          validators[_v] = { ...validators[_v], ...q, ...q.HistoricalValidatorStatistics[0], dataFetched: true };
        }
      });
    }
    model.busyFetchingData = false;
    m.redraw();
  }
};

const configureVisibleVals = (vnode) => {
  vnode.attrs.validators.forEach((v) => { v.visible = false; });
  vnode.attrs.validators
    .filter((v) => v.state === (model.selectedState === 0 ? 'Active' : 'Waiting') && (!model.searchInput || v.address.toLowerCase().indexOf(model.searchInput.toLowerCase()) > -1))
    .slice(0, (model.selectedState === 0 ? model.activeVisibleCount : model.waitingVisibleCount))
    .forEach((v) => { v.visible = true; });
};

const initFirstLaunch = async (vnode, stkcon: StakingController) => {
  console.log('setting up initial record');
  configureVisibleVals(vnode);
  fetchMissingDataForVisibleRecord(model.selectedState === 0 ? 'Active' : 'Waiting', vnode.attrs.validators, stkcon);
};

const sortValidators = (a, b) => {
  const sortkey = model.sortKey;
  const key = sortkey === 'exposure.total' ? (q) => +q?.exposure?.total
    : (sortkey === 'otherTotal' ? (q) => (Number(q?.exposure?.total) - q?.exposure?.own)
      : (sortkey === 'commissionPer' ? (q) => q?.commissionPer
        : (sortkey === 'eraPoints' ? (q) => q?.eraPoints
          : (q) => 0)));
  const a1 = key(a);
  const b1 = key(b);
  return model.sortAsc ? a1 - b1 : b1 - a1;
};

export const getBN = (bn) => bn ? (bn?.toBn ? bn.toBn() : new BN(Number(bn).toLocaleString().replace(/,/g, ''))) : new BN(0);

export const PresentationComponent_: m.Component<{ validators, valCount }, { firstLoad: boolean }> = {
  view: (vnode) => {
    const refreshTableVals = () => {
      configureVisibleVals(vnode);
      fetchMissingDataForVisibleRecord(model.selectedState === 0 ? 'Active' : 'Waiting', vnode.attrs.validators, app.staking);
    };
    if (!vnode.attrs || !vnode.attrs.validators?.length)
      return m(Spinner, {
        fill: true,
        message: 'Loading Validators...',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      });
    const chain = app.chain as Substrate;

    const lastHeaders = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.lastHeaders
      : [];

    if (vnode && vnode.attrs && vnode.attrs.validators) {
      if (!vnode.state.firstLoad) {
        vnode.state.firstLoad = true;
        initFirstLaunch(vnode, app.staking);
      }
    }

    // result.validators = result.validators?.sort((val1, val2) => val2?.exposure - val1?.exposure);


    // onscroll fetch next N record
    $('table.validators-table').on('scroll', function () {
      if (!model.busyFetchingData && $(this).scrollTop() + $(this).innerHeight() + ($(this)[0].scrollHeight * 0.08) >= $(this)[0].scrollHeight) {
        if (model.selectedState === 0) {
          model.activeVisibleCount += pageSize;
        } else {
          model.waitingVisibleCount += pageSize;
        }
        refreshTableVals();
      }
    });

    return m('div.validators-container',
      m(Tabs, [{
        // callback: reset,
        name: 'Current Validators',
        callback: (e) => {
          model.searchInput = '';
          model.selectedState = e;
          refreshTableVals();
        },
        content: m('div.row-input',
          m(Input, {
            type: 'text',
            name: 'searchCurrent',
            autofocus: true,
            fluid: true,
            placeholder: 'Search for a name, address or index...',
            value: model.searchInput,
            oninput: (e) => {
              model.searchInput = e.srcElement.value.trim();
              refreshTableVals();
            },
          }), m('tr.validators-heading', [
            m('th.val-stash', 'Stash'),
            m('th.val-total', 'Total Stake',
              m('div.sort-icon', m(Icon, {
                name: model.sortIcon('exposure.total'),
                size: 'lg',
                onclick: () => model.changeSort('exposure.total')
              }))),
            m('th.val-other', 'Other Stake',
              m('div.sort-icon', m(Icon, {
                name: model.sortIcon('otherTotal'),
                size: 'lg',
                onclick: () => model.changeSort('otherTotal')
              }))),
            m('th.val-commission', 'Commission',
              m('div.sort-icon', m(Icon, {
                name: model.sortIcon('commissionPer'),
                size: 'lg',
                onclick: () => model.changeSort('commissionPer')
              }))),
            m('th.val-points', 'Points',
              m('div.sort-icon', m(Icon, {
                name: model.sortIcon('eraPoints'),
                size: 'lg',
                onclick: () => model.changeSort('eraPoints')
              }))),
            m('th.val-apr', 'Est. APR'),
            m('th.val-rewards', 'Rewards'),
            m('th.val-slashes', 'Slashes'),
            m('th.val-offenses', 'Offenses'),
          ]), m('table.validators-table', [
            vnode.attrs.validators
              .filter((q) => q.visible && (model.selectedState === 0 && q.state === 'Active'))
              // total.sort((a, b) => (((+a.exposure?.total) - (b.exposure?.total))))
              .sort(sortValidators)
              .map((validator) => {
                // console.log("validator.exposure ===== ", validator.exposure, validator.stash)
                // total stake
                const total = chain.chain.coins(getBN(validator.exposure?.total));
                // own stake
                const bonded = chain.chain.coins(+validator.exposure?.own);
                const nominators = validator.exposure?.others.map(({ who, value }) => ({
                  stash: who.toString(),
                  balance: chain.chain.coins(+value),
                }));
                const stash = validator.address;
                const controller = validator.controller;
                const eraPoints = validator.eraPoints;
                const blockCount = validator.blockCount;
                const hasMessage = validator?.hasMessage;
                const isOnline = validator?.isOnline;
                const otherTotal = chain.chain.coins(getBN(validator.exposure?.total).sub(getBN(validator.exposure?.own)));
                const commission = validator?.commissionPer;
                const apr = validator?.apr;
                // const name = validator?.name;
                const rewardStats = validator?.rewardsStats;
                const slashesStats = validator?.slashesStats;
                const offencesStats = validator?.offencesStats;
                // let apr = annualPercentRate[validator];
                // apr = (apr === -1.0 || typeof apr === 'undefined') ? aprAvg : apr;
                return m(ValidatorRow, {
                  stash,
                  total,
                  bonded,
                  commission,
                  otherTotal,
                  controller,
                  nominators,
                  eraPoints,
                  blockCount,
                  hasMessage,
                  isOnline,
                  apr,
                  rewardStats,
                  slashesStats,
                  offencesStats
                });
              }), model.busyFetchingData && m(Spinner, {
              message: '',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })
          ])),
      }, {
        name: 'Waiting Validators',
        callback: (e) => {
          model.searchInput = '';
          model.selectedState = e;
          refreshTableVals();
        },
        content: [m('div.row-input',
          m(Input, {
            type: 'text',
            fluid: true,
            name: 'searchWaiting',
            autofocus: true,
            placeholder: 'Search for a name, address or index...',
            value: model.searchInput,
            oninput: (e) => {
              model.searchInput = e.srcElement.value.trim();
              refreshTableVals();
            },
          })), m('tr.validators-heading', [
          m('th.val-stash-waiting', 'Stash'),
          m('th.val-nominations', 'Nominations'),
          m('th.val-waiting-commission', 'Commission'),
          m('th.val-action', ''),
        ]), m('table.validators-table', [
          vnode.attrs.validators
            .filter((q) => q.visible && (model.selectedState === 1 && q.state === 'Waiting'))
            .sort(sortValidators)
            .map((validator) => {
              const stash = validator.address;
              const controller = validator.controller;
              const eraPoints = validator.eraPoints;
              const toBeElected = validator.toBeElected;
              const blockCount = validator.blockCount;
              const hasMessage = validator?.hasMessage;
              const isOnline = validator?.isOnline;
              const commission = validator?.commissionPer;
              const name = validator?.name;
              return m(ValidatorRowWaiting, {
                stash,
                controller,
                waiting: true,
                eraPoints,
                toBeElected,
                blockCount,
                hasMessage,
                isOnline,
                commission,
                name
              });
            }),
        ])]
      }, {
        // callback: reset,
        name: 'Recent Blocks',
        content: [m('tr.validators-heading', [
          m('th.val-block-number', 'Block #'),
          m('th.val-block-hash', 'Hash'),
          m('th.val-block-author', 'Author')
        ]), m('table.validators-table', [
          lastHeaders.map((lastHeader) => {
            if (!lastHeader)
              return null;
            return m(RecentBlock, {
              number: formatNumber(lastHeader.number),
              hash: lastHeader.hash.toHex(),
              author: lastHeader.author
            });
          })
        ])]
      }]));
  }
};

export default PresentationComponent_;
