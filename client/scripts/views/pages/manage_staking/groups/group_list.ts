import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { IValidators } from 'controllers/chain/substrate/account';
import { ICommissionInfo, GroupValidator } from 'controllers/chain/substrate/staking';
import Spinner from 'views/pages/spinner';
import BN from 'bn.js';
import { Tooltip, Grid, Col, CustomSelect, Icon, Icons } from 'construct-ui';
import User from 'views/components/widgets/user';

import Identity from '../../validators/substrate/identity';

const options = [
  {
    label: 'Options',
    value: '1',
    disabled: true
  }
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
    groups:  (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.getValidatorGroups
      : null
  }),
  view: (vnode) => {
    const { validators, groups, apr } = vnode.state.dynamic;

    if (!validators || !groups || !apr)
      return m(Spinner);

    return m('div.groups_list',
      m('table.validators-table',
        !groups.length && m('div.GroupRow', [
          m('h4', 'No saved groups yet')
        ]),
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
            m('div.groups',
              m(Grid, [
                m(Col, { span: 8 }, m('h3', group.name)),
                m(Col, { span: 4 },
                  m('div.right.padding-top-15',
                    m(CustomSelect, {
                      triggerAttrs: {},
                      defaultValue: '1',
                      options
                    }))),
              ]),
              m('tr.validators-heading.clear', [
                m('th.val-apr', 'APR'),
                m('th.val-ac-stake', 'ACCUMULATED STAKE'),
                m('th.val-bond', 'BOND'),
                m('th.val-commission', 'COMMISSION')
              ]),
              m('tr.ValidatorRow.summary',
                m('td.val-apr', `${avgAPR}%`),
                m('td.val-ac-stake', totalStake),
                m('td.val-bond', totalBonded),
                m('td.val-commission', `${avgCommission}%`)),
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
                  m('td.val-actions.pointer.right-sub',
                    m(Tooltip, {
                      content: 'Details',
                      position: 'top',
                      trigger: m(Icon, {
                        name: Icons.MORE_HORIZONTAL,
                        size: 'lg',
                        onclick: () => {}
                      })
                    })));
              }))
          ];
        })));
  }
});

export default StakeList;
