import m from 'mithril';
import app from 'state';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { makeDynamicComponent } from 'models/mithril';
import Substrate from 'controllers/chain/substrate/main';
import { DeriveSessionProgress } from '@polkadot/api-derive/types';
import { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import ManageStakingModal from './manage_staking';
import ClaimPayoutModal from './claim_payout';
import CardSummary from './card_summary';

interface IPreHeaderState {
  dynamic: {
    validators: IValidators;
    sessionInfo: DeriveSessionProgress;
  },
}

interface IPreHeaderAttrs {
  nominationsHasChanged;
  nominations;
  sender: SubstrateAccount;
}
const offence = {
  count: null,
  setCount(offences) {
    offence.count = offences.length;
    m.redraw();
  }
};

export const SubstratePreHeader = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({
  oncreate: async () => {
    await app.chainEvents.offences(offence.setCount);
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    sessionInfo: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.sessionInfo
      : null
  }),
  view: (vnode) => {
    const { validators, sessionInfo } = vnode.state.dynamic;
    const { nominations, nominationsHasChanged, sender } = vnode.attrs;
    if (!validators && !sessionInfo) return;

    const { validatorCount, currentEra,
      currentIndex, sessionLength,
      sessionProgress, eraLength,
      eraProgress, isEpoch } = sessionInfo;
    const nominators: string[] = [];
    let elected: number = 0;
    let waiting: number = 0;
    let totalStaked = (app.chain as Substrate).chain.coins(0);
    let hasClaimablePayouts = false;

    if (app.chain.base === ChainBase.Substrate) {
      (app.chain as Substrate).chain.api.toPromise()
        .then((api) => {
          if (api.query.staking.erasStakers) {
            hasClaimablePayouts = true;
          }
        });
    }

    Object.entries(validators).forEach(([_stash, { exposure, isElected }]) => {
      const valStake = (app.chain as Substrate).chain.coins(exposure?.total.toBn())
        || (app.chain as Substrate).chain.coins(0);
      totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));

      // count total nominators
      const others = exposure?.others || [];
      others.forEach((indv) => {
        const nominator = indv.who.toString();
        if (!nominators.includes(nominator)) {
          nominators.push(nominator);
        }
      });
      // count elected and waiting validators
      if (isElected) {
        elected++;
      } else {
        waiting++;
      }
    });
    const totalbalance = (app.chain as Substrate).chain.totalbalance;
    const staked = `${(totalStaked.muln(10000).div(totalbalance).toNumber() / 100).toFixed(2)}%`;

    return [
      m('.validators-preheader', [
        m('.validators-preheader-item', [
          m('h3', 'Validators'),
          m('.preheader-item-text', `${elected}/${validatorCount.toHuman()}`),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Waiting'),
          m('.preheader-item-text', `${waiting}`),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Nominators'),
          m('.preheader-item-text', `${nominators.length}`),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Total Offences'),
          m('.preheader-item-text', offence.count === null
            ? 'Loading'
            : `${offence.count}`),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Last Block'),
          m('.preheader-item-text', formatNumber((app.chain as Substrate).block.height)),
        ]),
        (isEpoch
          && m(CardSummary, {
            title: 'Epoch',
            total: sessionLength,
            value: sessionProgress,
            currentBlock: formatNumber(currentIndex)
          })),
        m(CardSummary, {
          title: 'Era',
          total: eraLength,
          value: eraProgress,
          currentBlock: formatNumber(currentEra)
        }),
      ]),
      m('.validators-preheader', [

        m('.validators-preheader-item', [
          m('h3', 'Total Supply'),
          m('.preheader-item-text', totalbalance.format(true)),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Total Staked'),
          m('.preheader-item-text', totalStaked.format(true)),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Staked'),
          m('.preheader-item-text', staked),
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
        hasClaimablePayouts && m('.validators-preheader-item', [
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
        nominationsHasChanged && m('.validators-preheader-item', [
          m('h3', 'Update nominations'),
          m('.preheader-item-text', [
            m('a.btn.formular-button-primary', {
              class: app.vm.activeAccount ? '' : 'disabled',
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                createTXModal((nominations.length === 0)
                  ? sender.chillTx()
                  : sender.nominateTx(nominations)).then(() => {
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
      ])
    ];
  }
});

export default SubstratePreHeader;