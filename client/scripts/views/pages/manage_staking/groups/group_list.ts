import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { IValidators } from 'controllers/chain/substrate/account';
import { ICommissionInfo, GroupValidator } from 'controllers/chain/substrate/staking';
import { from } from 'rxjs';
import Spinner from 'views/pages/spinner';
import BN from 'bn.js';
import { Tooltip, Grid, Col, CustomSelect, ListItem, Icon, Icons, IOption } from 'construct-ui';
import User from 'views/components/widgets/user';
import NewGroup from 'views/pages/manage_staking/groups/new_group';
import Identity from '../../validators/substrate/identity';

const options = [
  {
    label: 'Options',
    value: '1',
    disabled: true
  },
  // {
  //   label: 'Delete',
  //   value: '2'
  // }
];

export interface IStakeListState {
  dynamic: {
    validators: IValidators;
    apr: ICommissionInfo;
    groups: GroupValidator[]
  }
}

export interface StakeListAttrs {
}

const StakeList = makeDynamicComponent<StakeListAttrs, IStakeListState>({
  getObservables: () => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.validators
      : null,
    apr: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.annualPercentRate
      : null,
    groups: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.getValidatorGroups
      : null
  }),
  view: (vnode) => {
    const { validators, groups, apr } = vnode.state.dynamic;

    if (!validators || !groups || !apr)
      return m(Spinner);

    return [m('div.groups_window',
      groups.map((group) => {
        let aprSum = 0;
        let commission = 0;
        let acStake = new BN(0);
        let bonded = new BN(0);

        group.stashes.forEach((stash) => {
          apr[stash] = apr[stash] || 0;
          aprSum += Number(apr[stash]);
          if (validators[stash]) {
            acStake = acStake.add(validators[stash].exposure?.total.toBn());
            bonded = bonded.add(validators[stash].exposure?.own.toBn());
            commission += Number(validators[stash].commissionPer);
          }
        });

        const totalStake = (app.chain as Substrate).chain.coins(acStake).format(true);
        const totalBonded = (app.chain as Substrate).chain.coins(bonded).format(true);
        const avgCommission = (commission / group.stashes.length).toFixed(2);
        const avgAPR = (aprSum / group.stashes.length).toFixed(2);
        return [
          m('div.groups_list',
            m(Grid, [
              m(Col, { span: 8 }, m('h3', group.name)),
              m(Col, { span: 4 },
                m('div.right.padding-top-15',
                  m(CustomSelect, {
                    triggerAttrs: {},
                    defaultValue: '1',
                    options
                  }))),
            ]), [m('div.profile-stats-row1.row', [
              m('.total-apr',
                m('.data-row-block',
                  m('.profile-header-block',
                    'APR')),
                m('.info-row-block',
                  m('.profile-data-block',
                    `${avgAPR}%`))),
              m('.own-total-offences',
                m('.data-row-block',
                  m('.profile-header-block',
                    'ACCUMULATED STAKE')),
                m('.info-row-block',
                  m('.profile-data-block',
                    totalStake))),
              m('.other-total-slashes',
                m('.data-row-block',
                  m('.profile-header-block',
                    'BOND')),
                m('.info-row-block',
                  m('.profile-data-block',
                    totalBonded))),
              m('.total-rewards',
                m('.data-row-block',
                  m('.profile-header-block',
                    'COMMISSION')),
                m('.info-row-block',
                  m('.profile-data-block',
                    `${avgCommission}%`))),
            ]),
            m('table.validators-table',
              !groups.length && m('div.GroupRow', [
                m('h4', 'No saved groups yet')
              ]),
              m('tr.validators-heading.details', [
                m('th.val-stash', 'Stash'),
                m('th.val-stake', 'Stake'),
                m('th.val-commission', 'Commission'),
                m('th.val-actions', '')
              ]),
              group.stashes.map((stash) => {
                let stashStake = new BN(0);
                let commissionPer = 0;
                let online = false;
                if (validators[stash]) {
                  stashStake = validators[stash].exposure?.total.toBn();
                  commissionPer = validators[stash].commissionPer;
                  online = validators[stash].isOnline;
                }
                const stake = (app.chain as Substrate).chain.coins(stashStake).format(true);
                return m('tr.ValidatorRow.details',
                  m('td.val-stash',
                    m(Tooltip, {
                      content: m(Identity, { stash }),
                      trigger: m('div', m(User, { user: app.chain.accounts.get(stash), linkify: true }))
                    }),
                    m(Icon, {
                      name: online
                        ? Icons.WIFI
                        : Icons.WIFI_OFF,
                      size: 'xs'
                    })),
                  m('td.val-stake', stake),
                  m('td.val-commission', `${commissionPer.toFixed(2)}%`),
                  m('.val-actions',
                    m('span.button-options',
                      m(Tooltip, {
                        content: 'Details',
                        position: 'top',
                        trigger: m(Icon, {
                          name: Icons.MORE_HORIZONTAL,
                          size: 'lg',
                          onclick: () => { }
                        })
                      }))));
              }))])
        ];
      })), m('.row.group_button', app.user.jwt && m('.manage-staking-preheader-item', [
      m('.preheader-item-text', [
        m('button.cui-button.cui-align-center.cui-primary', {
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: NewGroup
            });
          },
        }, 'New Group ', m(Icon, { name: Icons.PLUS, size: 'xl' }))
      ]),
    ]))];
  }
});

export default StakeList;
