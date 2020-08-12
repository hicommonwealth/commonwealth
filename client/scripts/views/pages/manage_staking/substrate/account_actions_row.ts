import m from 'mithril';
import app from 'state';
import { Popover, Icons, Icon, MenuDivider, MenuItem, Size, PopoverMenu, Button, Switch } from 'construct-ui';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import User from 'views/components/widgets/user';
import { makeDynamicComponent } from 'models/mithril';
import { StakerState } from 'controllers/chain/substrate/staking';
import Identity from 'views/pages/validators/substrate/identity';
import { DeriveStakingAccount, DeriveBalancesAll } from '@polkadot/api-derive/types';
import { formatCoin } from 'adapters/currency';
import AddressInfo from './address_info';
import ListNominees from './list_nominees';

export interface IAccountActionsState {
  dynamic: {
    balancesAll: DeriveBalancesAll,
    stakingAccount: DeriveStakingAccount
  }
}

export interface AccountActionsAttrs {
  info: StakerState
}

const AccountActionsRow = makeDynamicComponent<AccountActionsAttrs, IAccountActionsState>({
  getObservables: (attrs) => ({
    groupKey: attrs.info.stashId,
    balancesAll: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.balancesAll(attrs.info.stashId)
      : null,
    stakingAccount: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.stakingAccount(attrs.info.stashId)
      : null
  }),
  view: (vnode) => {
    const { stakingAccount, balancesAll } = vnode.state.dynamic;
    const balance = stakingAccount?.stakingLedger?.active.unwrap();
    if (!stakingAccount || !balancesAll)
      return m('p', 'Loading ...');

    const {
      controllerId, destination, destinationId,
      hexSessionIdNext, hexSessionIdQueue, isLoading,
      isOwnController, isOwnStash, isStashNominating,
      isStashValidating, nominating, sessionIds,
      stakingLedger, stashId } = vnode.attrs.info;

    return m('tr.ManageStakingRow', [
      m('td.val-stashes', app.chain.loaded && m(Popover, {
        interactionType: 'hover',
        content: m(Identity, { stash: stashId }),
        trigger: m('div.stashes', m(User, {
          user: app.chain.accounts.get(stashId),
          linkify: true }))
      })),
      m('td.val-controller', app.chain.loaded && m(Popover, {
        interactionType: 'hover',
        content: m(Identity, { stash: controllerId }),
        trigger: m('div.controller', m(User, {
          user: app.chain.accounts.get(controllerId),
          linkify: true }))
      })),
      m('td.val-rewards', destination),
      m('td.val-bonded', formatCoin(app.chain.chain.coins(balance), true)),
      m('td.val-all', isStashValidating
        ? m(AddressInfo, {
          address: stashId,
          withHexSessionId: hexSessionIdNext !== '0x' && [hexSessionIdQueue, hexSessionIdNext],
          stakingAccount
        })
        : isStashNominating && m(ListNominees, {
          stashId,
          nominating
        })),
      !isLoading && m('td.val-btns', (isStashNominating || isStashValidating)
        ? m('span.icon-text', m(Icon, { name: Icons.STOP_CIRCLE, size: 'lg' }), ' Stop')
        : m('div',
          (!sessionIds.length || hexSessionIdNext === '0x')
            ? m('span.icon-text', m(Icon, { name: Icons.KEY, size: 'lg' }), ' Session Key')
            : m('span.icon-text', m(Icon, { name: Icons.STAR, size: 'lg' }), ' Validate'),
          m('span.icon-text', m(Icon, { name: Icons.THUMBS_UP, size: 'lg' }), ' Nominate'))),
      m('td.val-settings',
        m('span.right',
          m(PopoverMenu, {
            overlayClass: 'manage-staking-settings',
            content: [
              m(MenuItem, { label: 'Bond more funds' }),
              m(MenuItem, { label: 'Unbond funds' }),
              m(MenuItem, { label: 'Withdraw unbonded funds' }),
              m(MenuDivider),
              m(MenuItem, { label: 'Change controller account' }),
              m(MenuItem, { label: 'Change reward destination' }),
              m(MenuItem, { label: 'Change validator preferences' }),
              m(MenuDivider),
              m(MenuItem, { label: 'Change session keys' }),
              m(MenuItem, { label: 'Set nominees' }),
              m(MenuItem, { label: 'Inject session keys (advanced)' }),
            ],
            menuAttrs: { size: 'xs' },
            trigger: m(Icon, { name: Icons.SETTINGS, size: 'lg' })
          })))
    ]);
  }
});

export default AccountActionsRow;
