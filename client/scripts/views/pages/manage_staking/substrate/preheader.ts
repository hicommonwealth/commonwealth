import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatCoin } from 'adapters/currency';
import { Icon, Icons, Intent } from 'construct-ui';
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
  }
};

export const SubstratePreHeader = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { bondedTotal } = vnode.attrs;

    return [
      m('.manage-staking-preheader.right', [
        m('.manage-staking-preheader-item.padding-l-r-12', [
          m('h3', 'Total Bonded'),
          m('.preheader-item-text', formatCoin(app.chain.chain.coins(bondedTotal), true))
        ]),
        m('.manage-staking-preheader-item.padding-l-r-12', [
          m('.preheader-item-text', [
            m('button.cui-button.cui-align-center.cui-primary', {
              onclick: model.onNewNominee,
            }, 'Nominator ', m(Icon, { name: Icons.PLUS, size: 'xl' }))
          ]),
        ]),
        m('.manage-staking-preheader-item', [
          m('.preheader-item-text', [
            m('button.cui-button.cui-align-center.cui-primary', {
              onclick: model.onNewValidate,
            }, 'Validator ', m(Icon, { name: Icons.PLUS, size: 'xl' }))
          ]),
        ])
      ])
    ];
  }
});

export default SubstratePreHeader;
