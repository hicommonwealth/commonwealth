import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import { StakerState, sortStashes } from 'controllers/chain/substrate/staking';
import AccountActionsRow from 'views/pages/manage_staking/substrate/account_actions_row';

export interface IAccountActionsState {
  dynamic: { }
}

export interface AccountActionsAttrs {
  ownStashInfos?: StakerState[]
}

interface IModel {
  foundStashes: StakerState[]
}

const model: IModel = {
  foundStashes: []
};

const AccountActions = makeDynamicComponent<AccountActionsAttrs, IAccountActionsState>({
  oncreate: (vnode) => {
    const { ownStashInfos } = vnode.attrs;
    model.foundStashes = ownStashInfos.sort(sortStashes);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: () => {
    return m('div.account_actions',
      m('table.mange-staking-table', [
        m('tr.mange-staking-heading', [
          m('th.val-stashes', 'Stashes'),
          m('th.val-controller', 'Controller'),
          m('th.val-rewards', 'Rewards'),
          m('th.val-bonded', 'Bonded'),
          m('th.val-action', ''),
          m('th.val-btns', ''),
          m('th.val-settings', '')
        ]),
        model.foundStashes.map((info) => {
          return m(AccountActionsRow, { info });
        }),
      ]));
  }
});

export default AccountActions;
