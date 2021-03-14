import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';

export const SubstratePreHeader: m.Component<{}, {
  validators: IValidators;
}> = {
  oninit: (vnode) => {
    app.runWhenReady(async () => {
      vnode.state.validators = (app.chain.base === ChainBase.Substrate)
        ? await (app.chain as Substrate).accounts.validators : null;
    });
  },
  view: (vnode) => {
    const { validators } = vnode.state;
    if (!validators) return;

    let totalStaked = (app.chain as Substrate).chain.coins(0);
    Object.entries(validators).forEach(([_stash, { exposure }]) => {
      const valStake = (app.chain as Substrate).chain.coins(exposure.total.toBn());
      totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));
    });

    return m('.validators-preheader', [
      m('.validators-preheader-item', [
        m('h3', 'Total Supply'),
        m('.preheader-item-text', (app.chain as Substrate).chain.totalbalance.format(true)),
      ]),
      m('.validators-preheader-item', [
        m('h3', 'Total Staked'),
        m('.preheader-item-text', totalStaked.format(true)),
      ]),
    ]);
  }
};

export default SubstratePreHeader;
