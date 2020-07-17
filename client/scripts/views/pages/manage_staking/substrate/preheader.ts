import m from 'mithril';
import app from 'state';
import BN from 'bn.js';
import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatNumber } from '@polkadot/util';
import { formatCoin } from 'adapters/currency';
import { Icon, Icons } from 'construct-ui';
import NewNominator from 'views/pages/manage_staking/substrate/new_nominator';

interface IPreHeaderState {
  dynamic: { }
}

interface IPreHeaderAttrs {
  sender: SubstrateAccount;
  bondedTotal?: BN,
  stakedCount?: number
}

const model = {
  onNewNominee(e) {
    e.preventDefault();
    app.modals.create({
      modal: NewNominator
    });
  }
};

export const SubstratePreHeader = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { stakedCount, bondedTotal } = vnode.attrs;

    return [
      m('.manage-staking-preheader', [
        m('.manage-staking-preheader-item', [
          m('h3', 'Total Bonded'),
          m('.preheader-item-text', formatCoin(app.chain.chain.coins(bondedTotal), true))
        ]),
        m('.manage-staking-preheader-item', [
          m('h3', 'Staked Count'),
          m('.preheader-item-text', formatNumber(stakedCount))
        ]),
        m('.manage-staking-preheader-item', [
          m('.preheader-item-text', [
            m('a.btn.formular-button-primary', {
              href: '#',
              onclick: model.onNewNominee,
            }, m(Icon, { name: Icons.PLUS, size: 'xl' }), ' Nominator')
          ]),
        ])
      ])
    ];
  }
});

export default SubstratePreHeader;
