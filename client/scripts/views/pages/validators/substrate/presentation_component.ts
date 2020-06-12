import m from 'mithril';
import app from 'state';
import Substrate from 'controllers/chain/substrate/main';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons } from 'construct-ui';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';
import RecentBlock from './recent_block';

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
  if (!validators) return;

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
        // total stake
          const total = chain.chain.coins(validators[validator].exposure.total);
          // own stake
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          // other stake
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          const eraPoints = validators[validator].eraPoints;
          const commissionPer = validators[validator].commissionPer;
          const hasNominated: boolean = app.user.activeAccount && nominators
            && !!nominators.find(({ stash }) => stash === app.user.activeAccount.address);
          const blockCount = validators[validator].blockCount;
          const hasMessage = validators[validator]?.hasMessage;
          const isOnline = validators[validator]?.isOnline;
          // add validator to collection if hasNominated already
          if (hasNominated) {
            state.nominations.push(validator);
            state.originalNominations.push(validator);
          }
          return m(ValidatorRow, {
            stash: validator,
            controller,
            total,
            bonded,
            nominated,
            nominators,
            hasNominated,
            commissionPer,
            eraPoints,
            blockCount,
            hasMessage,
            isOnline,
            onChangeHandler: (result) => {
              if (state.nominations.indexOf(result) === -1) {
                state.nominations.push(result);
              } else {
                state.nominations = state.nominations.filter((n) => n !== result);
              }
            }
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
          // m('th.val-age', 'Validator Age'),
          m('th.val-action', ''),
        ]),
        waitingValidators.map((validator) => {
          const total = chain.chain.coins(0);
          const bonded = chain.chain.coins(0);
          const nominated = chain.chain.coins(0);
          const commissionPer = validators[validator].commissionPer;
          const nominators = [];
          const controller = validators[validator].controller;
          const eraPoints = validators[validator].eraPoints;
          const toBeElected = validators[validator].toBeElected;
          const blockCount = validators[validator].blockCount;
          const hasMessage = validators[validator]?.hasMessage;
          const isOnline = validators[validator]?.isOnline;
          return m(ValidatorRow, {
            stash: validator,
            controller,
            total,
            bonded,
            nominated,
            nominators,
            commissionPer,
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
