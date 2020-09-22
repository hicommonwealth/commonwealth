import m from 'mithril';
import app from 'state';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { makeDynamicComponent } from 'models/mithril';
import Substrate from 'controllers/chain/substrate/main';
import { DeriveSessionProgress } from '@polkadot/api-derive/types';
import { SubstrateAccount, IValidators } from 'controllers/chain/substrate/account';
import { ICommissionInfo } from 'controllers/chain/substrate/staking';
import { ChainBase } from 'models';
import { formatNumber } from '@polkadot/util';
import { Icon, Icons, Spinner, TextArea, Select, Button } from 'construct-ui';
import ManageStakingModal from './manage_staking';
import ClaimPayoutModal from './claim_payout';
import CardSummary from './card_summary';
interface IPreHeaderState {
  dynamic: {
    sessionInfo: DeriveSessionProgress;
    globalStatistics: any,
    sender: SubstrateAccount,
    validators: IValidators;
  },
}

interface IPreHeaderAttrs {
  sender: SubstrateAccount;
  annualPercentRate: ICommissionInfo;
}
const offence = {
  count: null,
  setCount(offences) {
    offence.count = offences.length;
    m.redraw();
  }
};

export const SubstratePreHeader = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({
  oncreate: async (vnode) => {
    vnode.state.dynamic.globalStatistics = await app.staking.globalStatistics();
    vnode.state.dynamic.sender = app.user.activeAccount as SubstrateAccount;
    const offences = await app.chainEvents.offences();
    offence.setCount(offences);
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    sessionInfo: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.sessionInfo
      : null
  }),
  view: vnode => {
    const { sessionInfo, globalStatistics, sender, validators } = vnode.state.dynamic;
    if (!validators && !sessionInfo && !globalStatistics) return;
    
    let { count = 0, rows = [] } = globalStatistics;
    let apr = 0.0;
    const { currentEra,
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

    rows.forEach((stats) => {
      const { exposure = {}, state = '' } = stats;
      const valStake = (app.chain as Substrate).chain.coins(+exposure?.total)
        || (app.chain as Substrate).chain.coins(0);
      totalStaked = (app.chain as Substrate).chain.coins(totalStaked.asBN.add(valStake.asBN));

      // count total nominators
      const others = exposure?.others || [];
      others.forEach((obj) => {
        const nominator = obj.who.toString();
        if (!nominators.includes(nominator)) {
          nominators.push(nominator);
        }
      });
      // count elected and waiting validators
      if (state === 'Active') {
        elected++;
      } else {
        waiting++;
      }
      // calculate est. apr
      apr += stats?.apr ? stats.apr : 0;
    });
    apr /= count;
    const totalbalance = (app.chain as Substrate).chain.totalbalance;
    const staked = `${(totalStaked.muln(10000).div(totalbalance).toNumber() / 100).toFixed(2)}%`;

    return m('div.validator-preheader-container', [
      m('.validators-preheader', [
        m('.validators-preheader-item', [
          m('h3', 'Validators'),
          m('.preheader-item-text', `${elected}/${count}`),
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
          && sessionProgress && m(CardSummary, {
          title: 'Epoch',
          total: sessionLength,
          value: sessionProgress,
          currentBlock: formatNumber(currentIndex)
        })),
        eraProgress
          && m(CardSummary, {
            title: 'Era',
            total: eraLength,
            value: eraProgress,
            currentBlock: formatNumber(currentEra)
          }),
        m('.validators-preheader-item', [ 
          m('h3', 'Est. APR'),
          m('.preheader-item-text', `${apr}%`),
        ]),
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
            m(Button, {
              label: 'Manage',
              class: app.user.activeAccount ? '' : 'disabled',
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: ManageStakingModal,
                  data: { account: sender }
                });
              }
            })
          ]),
        ]),
        hasClaimablePayouts && m('.validators-preheader-item', [
          m('h3', 'Claim Payout'),
          m('.preheader-item-text', [
            m(Button, {
              label: 'Claim',
              class: app.user.activeAccount ? '' : 'disabled',
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: ClaimPayoutModal,
                  data: { account: sender }
                });
              }
            })
          ]),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Update nominations'),
          m('.preheader-item-text', [
            m(Button, {
              label: 'Update',
              class: app.user.activeAccount ? '' : 'disabled',
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                createTXModal((nominators.length === 0)
                  ? sender.chillTx()
                  : sender.nominateTx(nominators)).then(() => {
                    // vnode.attrs.sending = false;
                    m.redraw();
                  }, () => {
                    // vnode.attrs.sending = false;
                    m.redraw();
                  });
              }
            })
          ]),
        ])
        ]),
      ])
  }
});

export default SubstratePreHeader;
