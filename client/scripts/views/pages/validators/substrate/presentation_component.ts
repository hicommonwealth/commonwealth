import m from 'mithril';
import app from 'state';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons } from 'construct-ui';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import ValidatorRowWaiting from './validator_row_waiting';
import RecentBlock from './recent_block';
import PageLoading from "views/pages/loading";


const model = {
  perPage: 20,
  currentPage: 1,
  currentTab: 'current',
  show: true,
  total: { waiting: 0, current: 0 },
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
  }
};

const PresentationComponent = (state, chain: Substrate) => {
  const validators = state.dynamic.validators;
  if (!validators) return m(PageLoading, {message:"Loading Validators..."});
  

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
    .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
    .slice(model.perPage * (model.currentPage - 1), model.perPage * model.currentPage);

  const waitingValidators = Object.keys(validators).filter((validator) => (validators[validator].isElected === false))
    .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
    .slice(model.perPage * (model.currentPage - 1), model.perPage * model.currentPage);

  return m('div',
    m(Tabs, [{
      callback: model.reset,
      name: 'Current Validators',
      content: m('table.validators-table', [
        m('tr.validators-heading', [
          m('th.val-controller', 'Controller'),
          m('th.val-stash', 'Stash'),
          m('th.val-total', 'Total Stake'),
          m('th.val-total', 'Own Stake'),
          m('th.val-total', 'Other Stake'),
          m('th.val-commission', 'Commission'),
          m('th.val-points', 'Points'),
          m('th.val-last-hash', 'last #'),
          m('th.val-action', ''),
        ]),
        currentValidators.map((validator) => {
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          const eraPoints = validators[validator].eraPoints;
          const blockCount = validators[validator].blockCount;
          const hasMessage = validators[validator]?.hasMessage;
          const isOnline = validators[validator]?.isOnline;
          return m(ValidatorRow, {
            stash: validator,
            controller,
            nominators,
            eraPoints,
            blockCount,
            hasMessage,
            isOnline
          });
        }),
      ])
    }, {
      callback: model.reset,
      name: 'Waiting Validators',
      content: m('table.validators-table', [
        m('tr.validators-heading', [
          m('th.val-stash', 'Stash'),
          m('th.val-points', 'Nominations'),
          m('th.val-commission', 'Commission'),
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
      m(Icon, { name: Icons.ARROW_LEFT_CIRCLE, size: 'lg', onclick: model.previous }),
      m('label', { style: { marginLeft: '20px' } },
        `${model.currentPage}/${Math.ceil(model.total[model.currentTab] / model.perPage)}`),
      m(Icon, { name: Icons.ARROW_RIGHT_CIRCLE, size: 'lg', onclick: model.next }),
    ]));
};

export default PresentationComponent;
