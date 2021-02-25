import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatCoin } from 'adapters/currency';
import { Button, Icon, Icons, Intent } from 'construct-ui';
import NewNominator from 'views/pages/manage_staking/substrate/new_nominator';
import NewValidator from 'views/pages/manage_staking/substrate/new_validator';

interface IPreHeaderState {
  dynamic: { }
}
interface IPreHeaderAttrs {
  sender: SubstrateAccount;
  bondedTotal?: BN
}
interface IModel {
  onNewNominee(e: Event): void,
  onNewValidate(e: Event): void,
}

const model: IModel = {
  onNewNominee(e: Event) {
    e.preventDefault();
    app.modals.create({
      modal: NewNominator
    });
  },
  onNewValidate(e: Event) {
    e.preventDefault();
    app.modals.create({
      modal: NewValidator
    });
  },
};

export const SubstratePreHeader = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { bondedTotal } = vnode.attrs;

    return [
      m('.manage-staking-preheader', [
        m('h2.ct', 'Manage Staking'),
        m('.manage-staking-preheader-item.padding-l-r-12', [
          m('.preheader-item-text', [
            m(Button, {
              label: m('', ['Nominator ', m(Icon, { name: Icons.PLUS, size: 'sm' })]),
              class: app.user.activeAccount ? '' : 'disabled',
              href: 'javascript;',
              onclick: model.onNewNominee,
              disabled: !app.user.activeAccount
            })
          ]),
        ]),
        m('.manage-staking-preheader-item.padding-l-r-12', [
          m('.preheader-item-text', [

            m(Button, {
              label: m('', ['Validator ', m(Icon, { name: Icons.PLUS, size: 'sm' })]),
              class: app.user.activeAccount ? '' : 'disabled',
              href: 'javascript;',
              onclick: model.onNewValidate,
              disabled: !app.user.activeAccount
            })
          ]),
        ]),
      ])
    ];
  }
});

export default SubstratePreHeader;
