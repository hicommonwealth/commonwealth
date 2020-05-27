import m from 'mithril';
import app from 'state';
import { formatCoin } from 'adapters/currency';
import { pluralize } from 'helpers';
import User from 'views/components/widgets/user';
import { IValidatorAttrs, ViewNominatorsModal } from '..';

interface IValidatorState {
  isNominating: boolean;
}

const ValidatorRow: m.Component<IValidatorAttrs, IValidatorState> = {
  oninit: (vnode) => {
    vnode.state.isNominating = vnode.attrs.hasNominated;
  },
  view: (vnode) => {
    const commissionPer = Number(vnode.attrs.commissionPer).toFixed(2);
    return m('tr.ValidatorRow', [
      m('td.val-name', 'Validator'),
      m('td.val-commission', `${commissionPer}%`),
      m('td.val-controller', m(User, { user: app.chain.accounts.get(vnode.attrs.controller), linkify: true })),
      m('td.val-stash', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true })),
      m('td.val-total', [
        formatCoin(vnode.attrs.total, true),
        ' ',
        vnode.attrs.nominators.length > 0 && [
          '(',
          m('a.val-nominators', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: ViewNominatorsModal,
                data: { nominators: vnode.attrs.nominators, validatorAddr: vnode.attrs.stash }
              });
            }
          }, pluralize(vnode.attrs.nominators.length, 'nominator')),
          ')',
        ],
      ]),
      // m('td.val-age', '--'),
      // m('td.val-action', [
      //   m('button.nominate-validator.formular-button-primary', {
      //     class: app.user.activeAccount ? '' : 'disabled',
      //     onclick: (e) => {
      //       e.preventDefault();
      //       vnode.state.isNominating = !vnode.state.isNominating;
      //       vnode.attrs.onChangeHandler(vnode.attrs.stash);
      //     }
      //   }, vnode.state.isNominating ? 'Un-Nominate' : 'Nominate'),
      // ]),
    ]);
  }
};

export default ValidatorRow;
