import m from 'mithril';
import app from 'state';
import Substrate from 'controllers/chain/substrate/main';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';

const PresentationComponent = (state, chain: Substrate) => {
  const validators = state.dynamic.validators;
  if (!validators) return;
  return m(Tabs, [{
    name: 'Current Validators',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-commission', 'Commission'),
        m('th.val-controller', 'Controller'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (
        validators[validator].isElected === true && validators[validator].isWaiting === false
      )).sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(validators[validator].exposure.total);
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          const commissionPer = validators[validator].commissionPer;
          const hasNominated: boolean = app.vm.activeAccount && nominators
            && !!nominators.find(({ stash }) => stash === app.vm.activeAccount.address);
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
    name: 'Next Up',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-commission', 'Commission'),
        m('th.val-controller', 'Controller'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (
        validators[validator].isElected === false && validators[validator].isWaiting === false
      )).sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(validators[validator].exposure.total);
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const commissionPer = validators[validator].commissionPer;
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          return m(ValidatorRow, {
            stash: validator,
            controller,
            total,
            bonded,
            nominated,
            nominators,
            commissionPer
          });
        }),
    ])
  }, {
    name: 'Waiting Validators',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-commission', 'Commission'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (
        validators[validator].isElected === false && validators[validator].isWaiting === true
      )).sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(0);
          const bonded = chain.chain.coins(0);
          const nominated = chain.chain.coins(0);
          const commissionPer = validators[validator].commissionPer;
          const nominators = [];
          const controller = validators[validator].controller;
          return m(ValidatorRow, {
            stash: validator,
            controller,
            total,
            bonded,
            nominated,
            nominators,
            commissionPer,
            waiting: true
          });
        }),
    ])
  }]);
};

export default PresentationComponent;
