import m from 'mithril';
import app from 'state';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import User from 'views/components/widgets/user';
import ActionForm from './action_form';

const ControllerForm: m.Component<{ stashes, stashAccount }, {}> = {
  view: (vnode) => [
    m('p', `This account is configured as a controller for ${vnode.attrs.stashAccount}`),
    vnode.attrs.stashes.map(([stash, { exposure, balance }]) => m('.well', [
      m('.stash-stat', [
        m('h5', 'Stash'),
        m('.stash-stat-text', [
          m(User, { user: (app.chain as Substrate).accounts.fromAddress(stash), avatarSize: 24 }),
        ]),
      ]),
      m('.stash-stat', [
        m('h5', 'Bonded'),
        m('.stash-stat-text', [
          m('.stash-balance', app.chain.chain.coins(exposure.own).format(true)),
        ]),
      ]),
      m('.stash-stat', [
        m('h5', 'Free'),
        m('.stash-stat-text', [
          // XXX: this needs to be fixed!
          m('.stash-balance', app.chain.chain.coins(0/*balance*/).format(true)),
        ]),
      ]),
      m('.clear'),
    ])),
    m('.stash-actions', [
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Unbond from stash',
        actionName: 'unbond',
        placeholder: 'Enter a token amount to unbond from',
        errorMsg: 'Can only unbond on Substrate based chain.',
        onChangeHandler: (unbondAmount) => (app.chain.chain.coins(+unbondAmount, true)),
        actionHandler: (unbondAmount) => (app.vm.activeAccount as SubstrateAccount).unbond(unbondAmount),
      }),
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Set new session keys',
        actionName: 'setKeys',
        placeholder: 'Enter the keys result from rotate_keys',
        errorMsg: 'Can only set session keys on Substrate based chain.',
        onChangeHandler: (keys) => keys,
        actionHandler: (keys) => (app.vm.activeAccount as SubstrateAccount).setKeys(keys),
      }),
      m(ActionForm, {
        isTextInput: true,
        titleMsg: 'Set validator commission [0-100]',
        actionName: 'validate',
        placeholder: 'Enter a value between 0 and 100',
        errorMsg: 'Can only validate on Substrate based chain.',
        onChangeHandler: (commission) => commission,
        actionHandler: (commission) => (app.vm.activeAccount as SubstrateAccount).validateTx(commission),
      }),
      vnode.attrs.stashes.length > 0 && m(ActionForm, {
        titleMsg: 'Chill from nominating/validating',
        actionName: 'chill',
        placeholder: 'Chill',
        errorMsg: 'Can only chill on Substrate based chain.',
        actionHandler: () => (app.vm.activeAccount as SubstrateAccount).chillTx(),
      }),
    ]),
  ],
};

export default ControllerForm;
