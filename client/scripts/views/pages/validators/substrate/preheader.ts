import m from 'mithril';
import app from 'state';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';
import ManageStakingModal from './manage_staking';
import ClaimPayoutModal from './claim_payout';
import { IValidatorPageState } from '..';

export const SubstratePreHeader = (state: IValidatorPageState, chain: Substrate, sender: SubstrateAccount) => {
  const {
    validators,
    currentSession,
    currentEra,
    activeEra,
    stakingLedger
  } = state.dynamic;
  const isController: boolean = !!state.dynamic.stakingLedger;
  if (!validators) return;
  let totalStaked = chain.chain.coins(0);
  Object.entries(validators).forEach(([_stash, { exposure }]) => {
    const valStake = chain.chain.coins(exposure.total.toBn());
    totalStaked = chain.chain.coins(totalStaked.asBN.add(valStake.asBN));
  });
  return m('.validators-preheader', [
    m('.validators-preheader-item', [
      m('h3', 'Current Block'),
      m('.preheader-item-text', chain.block.height),
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
      m('.preheader-item-text', chain.chain.totalbalance.format(true)),
    ]),
    m('.validators-preheader-item', [
      m('h3', 'Total Staked'),
      m('.preheader-item-text', totalStaked.format(true)),
    ]),
    m('.validators-preheader-item', [
      m('h3', 'Manage Staking'),
      m('.preheader-item-text', [
        m('a.btn.formular-button-primary', {
          class: app.vm.activeAccount ? '' : 'disabled',
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
    isController && m('.validators-preheader-item', [
      m('h3', 'Claim Payout'),
      m('.preheader-item-text', [
        m('a.btn.formular-button-primary', {
          class: app.vm.activeAccount ? '' : 'disabled',
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
    state.nominationsHasChanged && m('.validators-preheader-item', [
      m('h3', 'Update nominations'),
      m('.preheader-item-text', [
        m('a.btn.formular-button-primary', {
          class: app.vm.activeAccount ? '' : 'disabled',
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            createTXModal((state.nominations.length === 0)
              ? sender.chillTx()
              : sender.nominateTx(state.nominations)).then(() => {
              // vnode.attrs.sending = false;
              m.redraw();
            }, (e) => {
              // vnode.attrs.sending = false;
              m.redraw();
            });
          }
        }, 'Update nominations'),
      ]),
    ]),
  ]);
};

export default SubstratePreHeader;
