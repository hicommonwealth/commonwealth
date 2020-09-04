import m from 'mithril';
import app from 'state';
import { get } from 'lodash';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons, Spinner, TextArea, Select } from 'construct-ui';
import PageLoading from 'views/pages/loading';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';

const model = {
  perPage: 20,
  currentPage: 1,
  currentTab: 'current',
  show: true,
  total: { waiting: 0, current: 0 },
  sortKey: 'exposure.total',
  sortAsc: true,
  sortIcon(key: string) {
    return model.sortKey === key
      ? model.sortAsc
        ? Icons.ARROW_UP
        : Icons.ARROW_DOWN
      : Icons.MINUS;
  },
  reset(index) {
    model.currentPage = 1;
    model.show = true;
    if (index === 0)
      model.currentTab = 'current';
    if (index === 1)
      model.currentTab = 'waiting';
    if (index > 1)
      model.show = false;
  },
  previous() {
    if (model.currentPage > 1)
      model.currentPage--;
  },
  next() {
    if (model.currentPage < Math.ceil(model.total[model.currentTab] / model.perPage))
      model.currentPage++;
  },
  changeSort(key: string) {
    if (key === model.sortKey)
      model.sortAsc = !model.sortAsc;
    model.sortKey = key;
  }
};

const PresentationComponent = (state, chain: Substrate) => {
  const { validators, annualPercentRate } = state.dynamic;

  if (!validators)
    return m(Spinner, {
      fill: true,
      message: 'Loading Validators...',
      size: 'xl',
      style: 'visibility: visible; opacity: 1;'
    });

  const lastHeaders = (app.chain.base === ChainBase.Substrate)
    ? (app.chain as Substrate).staking.lastHeaders
    : [];

  model.total.current = Object.keys(validators).filter(
    (validator) => (validators[validator].isElected === true)
  ).length;

  model.total.waiting = Object.keys(validators).filter(
    (validator) => (validators[validator].isElected === false)
  ).length;

  const currentValidators = Object.keys(validators).filter((validator) => (validators[validator].isElected === true))
    .sort((val1, val2) => {
      if (model.sortAsc)
        return get(validators[val2], model.sortKey, 0) - get(validators[val1], model.sortKey, 0);
      return get(validators[val1], model.sortKey, 0) - get(validators[val2], model.sortKey, 0);
    })
    .slice(model.perPage * (model.currentPage - 1), model.perPage * model.currentPage);

  const waitingValidators = Object.keys(validators).filter((validator) => (validators[validator].isElected === false))
    .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
    .slice(model.perPage * (model.currentPage - 1), model.perPage * model.currentPage);

  const filtered = Object.keys(annualPercentRate)
    .map((elt) => annualPercentRate[elt])
    .filter((elt) => elt > -1.0 && elt < 1000.0);
  const aprSum = filtered.reduce((prev, curr) => prev + curr, 0.0);
  const aprAvg = (aprSum * 1.0) / filtered.length;
  return m('div.validators-container',
    m(Tabs, [{
      callback: model.reset,
      name: 'Current Validators',
      content: m('table.validators-table', [
        m(Select, {
          options: ['Address', 'Name'],
          defaultValue: 'Address',
          onchange: () => null
        }),
        m('input', {
          type: 'text',
          autofocus: true,
          placeholder: 'Search for a name, address or index...'
        }),
        m('tr.validators-heading', [
          m('th.val-stash', 'Stash'),
          m('th.val-total', 'Total Stake',
            m(Icon, { name: model.sortIcon('exposure.total'),
              size: 'lg',
              onclick: () => model.changeSort('exposure.total') })),
          // m('th.val-own', 'Own Stake',
          //   m(Icon, { name: model.sortIcon('exposure.own'),
          //     size: 'lg',
          //     onclick: () => model.changeSort('exposure.own') })),
          m('th.val-other', 'Other Stake',
            m(Icon, { name: model.sortIcon('otherTotal'),
              size: 'lg',
              onclick: () => model.changeSort('otherTotal') })),
          m('th.val-commission', 'Commission',
            m(Icon, { name: model.sortIcon('commissionPer'),
              size: 'lg',
              onclick: () => model.changeSort('commissionPer') })),
          m('th.val-rewards-slashes-offenses', 'Rewards/Slashes/Offenses'),
          m('th.val-points', 'Points',
            m(Icon, { name: model.sortIcon('eraPoints'),
              size: 'lg',
              onclick: () => model.changeSort('eraPoints') })),
          m('th.val-apr', 'Est. APR'),
          // m('th.val-last-hash', 'last #'),
          m('th.val-action', ''),
        ]),
        currentValidators.map((validator) => {
          // total stake
          const total = chain.chain.coins(validators[validator].exposure.total);
          // own stake
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          const eraPoints = validators[validator].eraPoints;
          const blockCount = validators[validator].blockCount;
          const hasMessage = validators[validator]?.hasMessage;
          const isOnline = validators[validator]?.isOnline;
          const otherTotal = validators[validator]?.otherTotal;
          const commission = validators[validator]?.commissionPer;
          let apr = annualPercentRate[validator];
          apr = (apr === -1.0 || typeof apr === 'undefined') ? aprAvg : apr;
          return m(ValidatorRow, {
            stash: validator,
            total,
            // bonded,
            commission,
            otherTotal,
            controller,
            nominators,
            eraPoints,
            blockCount,
            hasMessage,
            isOnline,
            apr: (apr === -1.0) ? aprAvg : apr,
          });
        }),
      ])
    }, {
      callback: model.reset,
      name: 'Waiting Validators',
      content: m('table.validators-table', [
        m(Select, {
          options: ['Address', 'Name'],
          defaultValue: 'Address',
          onchange: () => null
        }),
        m('input', {
          type: 'text',
          autofocus: true,
          placeholder:'Search for a name, address or index...'
        }),
        m('tr.validators-heading', [
          m('th.val-stash-waiting', 'Stash'),
          m('th.val-nominations', 'Nominations'),
          m('th.val-waiting-commission', 'Commission'),
          m('th.val-action', ''),
        ]),
        waitingValidators.map((validator) => {
          const controller = validators[validator].controller;
          const eraPoints = validators[validator].eraPoints;
          const toBeElected = validators[validator].toBeElected;
          const blockCount = validators[validator].blockCount;
          const hasMessage = validators[validator]?.hasMessage;
          const isOnline = validators[validator]?.isOnline;
          return m(ValidatorRowWaiting, {
            stash: validator,
            controller,
            waiting: true,
            eraPoints,
            toBeElected,
            blockCount,
            hasMessage,
            isOnline
          });
        }),
      ])
    }, {
      callback: model.reset,
      name: 'Recent Blocks',
      content: m('table.validators-table', [
        m('tr.validators-heading', [
          m('th.val-block-number', 'Block #'),
          m('th.val-block-hash', 'Hash'),
          m('th.val-block-author', 'Author')
        ]),
        lastHeaders.map((lastHeader) => {
          if (!lastHeader)
            return null;
          return m(RecentBlock, {
            number: formatNumber(lastHeader.number),
            hash: lastHeader.hash.toHex(),
            author: lastHeader.author
          });
        })
      ])
    }]),
    model.show
    && m('span', [
      m(Icon, { name: Icons.SKIP_BACK, size: 'lg', onclick: model.previous }),
      m('label', { style: { marginLeft: '20px' } },
        `${model.currentPage}/${Math.ceil(model.total[model.currentTab] / model.perPage)}`),
      m(Icon, { name: Icons.SKIP_FORWARD, size: 'lg', onclick: model.next }),
    ]));
};

export default PresentationComponent;
