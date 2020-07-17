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

const AccountActions = makeDynamicComponent<AccountActionsAttrs, IAccountActionsState>({
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { ownStashInfos } = vnode.attrs;

    const foundStashes: StakerState[] = ownStashInfos.sort(sortStashes);

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
        foundStashes.map((info) => {
          return m(AccountActionsRow, { info });
        }),
      ]));
  }
});

export default AccountActions;
