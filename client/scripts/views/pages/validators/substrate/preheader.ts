import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';
import { StakingLedger, ActiveEraInfo, EraIndex, SessionIndex } from '@polkadot/types/interfaces';
import ManageStakingModal from './manage_staking';
import ClaimPayoutModal from './claim_payout';

interface IPreHeaderState {
  validators: IValidators;
  currentSession: SessionIndex;
  currentEra: EraIndex;
  activeEra: ActiveEraInfo;
  stakingLedger: StakingLedger;
}

interface IPreHeaderAttrs {
  nominationsHasChanged;
  nominations;
  sender: SubstrateAccount;
}

export const SubstratePreHeader: m.Component<IPreHeaderAttrs, IPreHeaderState> = {
  oninit: (vnode) => {
    app.runWhenReady(async () => {
      vnode.state.validators = (app.chain.base === ChainBase.Substrate)
        ? await (app.chain as Substrate).accounts.validators : null;
      vnode.state.currentSession = (app.chain.base === ChainBase.Substrate)
        ? await (app.chain as Substrate).chain.session : null;
      vnode.state.currentEra = (app.chain.base === ChainBase.Substrate)
        ? await (app.chain as Substrate).chain.currentEra : null;
      vnode.state.activeEra = (app.chain.base === ChainBase.Substrate)
        ? await (app.chain as Substrate).chain.activeEra : null;
      vnode.state.stakingLedger = (app.chain.base === ChainBase.Substrate && app.user.activeAccount)
        ? await (app.user.activeAccount as SubstrateAccount).stakingLedger
        : null;
    });
  },
  view: (vnode) => {
    const { validators, stakingLedger, currentSession, currentEra, activeEra } = vnode.state;
    const { nominations, nominationsHasChanged, sender } = vnode.attrs;
    if (!validators) return;

    let totalStaked = (app.chain as Substrate).chain.coins(0);
    const hasClaimablePayouts = app.chain.base === ChainBase.Substrate
      && !!(app.chain as Substrate).chain.api.query.staking.erasStakers;

    Object.entries(validators).forEach(([_stash, { exposure }]) => {
      const valStake = (app.chain as Substrate).chain.coins(exposure.total.toBn());
      totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));
    });
    return m('.validators-preheader', [
      m('.validators-preheader-item', [
        m('h3', 'Current Block'),
        m('.preheader-item-text', (app.chain as Substrate).block.height),
      ]),
      m('.validators-preheader-item', [
        m('h3', 'Current Session'),
        m('.preheader-item-text', currentSession.toString()),
      ]),
      m('.validators-preheader-item', [
        m('h3', 'Current Era'),
        m('.preheader-item-text', currentEra.toString()),
      ]),
      m('.validators-preheader-item', [
        m('h3', 'Total Supply'),
        m('.preheader-item-text', (app.chain as Substrate).chain.totalbalance.format(true)),
      ]),
      m('.validators-preheader-item', [
        m('h3', 'Total Staked'),
        m('.preheader-item-text', totalStaked.format(true)),
      ]),
      m('.validators-preheader-item', [
        m('h3', 'Manage Staking'),
        m('.preheader-item-text', [
          m('a.btn.formular-button-primary', {
            class: app.user.activeAccount ? '' : 'disabled',
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: ManageStakingModal,
                data: { account: sender }
              });
            }
          }, 'Manage'),
        ]),
      ]),
      hasClaimablePayouts && m('.validators-preheader-item', [
        m('h3', 'Claim Payout'),
        m('.preheader-item-text', [
          m('a.btn.formular-button-primary', {
            class: app.user.activeAccount ? '' : 'disabled',
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: ClaimPayoutModal,
                data: { account: sender }
              });
            }
          }, 'Claim'),
        ]),
      ]),
      nominationsHasChanged && m('.validators-preheader-item', [
        m('h3', 'Update nominations'),
        m('.preheader-item-text', [
          m('a.btn.formular-button-primary', {
            class: app.user.activeAccount ? '' : 'disabled',
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              createTXModal((nominations.length === 0)
                ? sender.chillTx()
                : sender.nominateTx(nominations)).then(() => {
                // vnode.attrs.sending = false;
                m.redraw();
              }, () => {
                // vnode.attrs.sending = false;
                m.redraw();
              });
            }
          }, 'Update nominations'),
        ]),
      ]),
    ]);
  }
};

export default SubstratePreHeader;
