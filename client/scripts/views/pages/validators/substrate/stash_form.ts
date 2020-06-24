import m from 'mithril';
import app from 'state';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import ActionForm from './action_form';

const StashForm: m.Component<{ controller: SubstrateAccount }, {}> = {
  view: (vnode) => [
    m('p', `This account is configured as a stash for ${vnode.attrs.controller.address}`),
    m('h4', 'Stash actions'),
    m('.stash-actions', [
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Set a new controller',
        actionName: 'setController',
        placeholder: 'Set a new controller',
        errorMsg: 'Can only set controller on Substrate based chain.',
        onChangeHandler: (newController) => (app.chain.accounts as SubstrateAccounts).fromAddress(newController),
        actionHandler: (newController) => (app.user.activeAccount as SubstrateAccount).setController(newController),
      }),
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Add extra bond',
        actionName: 'bondExtra',
        placeholder: 'Bond extra',
        errorMsg: 'Can only bond extra on Substrate based chain.',
        onChangeHandler: (bondAmount) => (app.chain.chain.coins(+bondAmount, true)),
        actionHandler: (bondAmount) => (app.user.activeAccount as SubstrateAccount).bondExtraTx(bondAmount),
      }),
      m(ActionForm, {
        isTextInput: false,
        titleMsg: 'Set a new reward destination',
        actionName: 'setPayee',
        placeholder: 'Set new reward destination',
        errorMsg: 'Can only set payee on Substrate based chain.',
        options: {
          name: 'rewardDestination',
          style: 'padding: 5px',
        },
        choices: [
          { value: 'staked', label: 'Stash account (increase the amount at stake)' },
          { value: 'stash', label: 'Stash account (do not increase the amount at stake)' },
          { value: 'controller', label: 'Controller account' },
        ],
        defaultValue: 'staked',
        onChangeHandler: (payee) => payee,
        actionHandler: (payee) => (app.user.activeAccount as SubstrateAccount).setPayee(payee),
      }),
    ]),
  ],
};

export default StashForm;
