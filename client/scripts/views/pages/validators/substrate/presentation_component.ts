import m from 'mithril';
import app from 'state';
import Substrate from 'controllers/chain/substrate/main';
import Tabs from '../../../components/widgets/tabs';
import ValidatorRow from './validator_row';

const PresentationComponent = (vnode, chain: Substrate) => {
  const validators = vnode.state.dynamic.validators;
  if (!validators) return;
  return m(Tabs, [{
    name: 'Current Validators',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-controller', 'Controller'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (validators[validator].isElected === true))
        .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(validators[validator].exposure.total);
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          const hasNominated: boolean = app.vm.activeAccount && nominators
            && !!nominators.find(({ stash }) => stash === app.vm.activeAccount.address);
          // add validator to collection if hasNominated already
          if (hasNominated) {
            vnode.state.nominations.push(validator);
            vnode.state.originalNominations.push(validator);
          }
          return m(ValidatorRow, {
            stash: validator,
            controller,
            total,
            bonded,
            nominated,
            nominators,
            hasNominated,
            onChangeHandler: (result) => {
              if (vnode.state.nominations.indexOf(result) === -1) {
                vnode.state.nominations.push(result);
              } else {
                vnode.state.nominations = vnode.state.nominations.filter((n) => n !== result);
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
        m('th.val-controller', 'Controller'),
        m('th.val-stash', 'Stash'),
        m('th.val-total', 'Total Bonded'),
        // m('th.val-age', 'Validator Age'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (validators[validator].isElected !== true))
        .sort((val1, val2) => validators[val2].exposure - validators[val1].exposure)
        .map((validator) => {
          const total = chain.chain.coins(validators[validator].exposure.total);
          const bonded = chain.chain.coins(validators[validator].exposure.own);
          const nominated = chain.chain.coins(total.asBN.sub(bonded.asBN));
          const nominators = validators[validator].exposure.others.map(({ who, value }) => ({
            stash: who.toString(),
            balance: chain.chain.coins(value),
          }));
          const controller = validators[validator].controller;
          return m(ValidatorRow, { stash: validator, controller, total, bonded, nominated, nominators });
        }),
    ])
  }]);
};

export default PresentationComponent;
