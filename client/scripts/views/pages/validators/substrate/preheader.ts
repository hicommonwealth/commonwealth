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
  },
}

interface IPreHeaderAttrs {
  validators: IValidators;
  valCount: Number;
  sender: SubstrateAccount;
  annualPercentRate: ICommissionInfo;
}

const itemLoadingSpinner = () => m(Spinner, { active: true, fill: false, size: 'xs' });

export const SubstratePreHeader = makeDynamicComponent<IPreHeaderAttrs, IPreHeaderState>({
  oncreate: async (vnode) => {
    vnode.state.dynamic.globalStatistics = await app.staking.globalStatistics();
    vnode.state.dynamic.sender = app.user.activeAccount as SubstrateAccount;
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    sessionInfo: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.sessionInfo
      : null
  }),
  view: (vnode) => {
    const nominators: string[] = [];
    const stDynamic = vnode.state.dynamic;
    let sessionInfo,
      globalStatistics: { waiting?: any; totalStaked?: any; elected?: any; count?: any; nominators?: any; offences?: any; aprPercentage?: any; },
      sender,
      validators: IValidators,
      currentEra: number,
      currentIndex: number,
      sessionLength: any,
      sessionProgress: any,
      eraLength: any,
      eraProgress: any,
      isEpoch: any;
    let waiting: number = 0;
    let totalStaked;
    let hasClaimablePayouts = false;
    sessionInfo = globalStatistics = sender = validators = {};
    currentEra = currentIndex = sessionLength = sessionProgress = 0;

    if (stDynamic.globalStatistics) {
      globalStatistics = stDynamic.globalStatistics;
    }

    if (app.chain && stDynamic && stDynamic.sessionInfo && stDynamic.globalStatistics) {
      sessionInfo = stDynamic.sessionInfo;

      sender = vnode.state.dynamic.sender;
      validators = vnode.attrs.validators;
      currentEra = sessionInfo.currentEra;
      currentIndex = sessionInfo.currentIndex;
      sessionLength = sessionInfo.sessionLength;
      sessionProgress = sessionInfo.sessionProgress;
      eraLength = sessionInfo.eraLength;
      eraProgress = sessionInfo.eraProgress;
      isEpoch = sessionInfo.isEpoch;

      totalStaked = (app.chain as Substrate).chain.coins(globalStatistics.totalStaked);
    }

    if (app.chain.base === ChainBase.Substrate) {
      (app.chain as Substrate).chain.api.toPromise()
        .then((api) => {
          if (api.query.staking.erasStakers) {
            hasClaimablePayouts = true;
          }
        });
    }

    const totalbalance = (app.chain as Substrate).chain.totalbalance;
    const stakedPercentage = totalStaked ? `${(totalStaked.muln(10000).div(totalbalance).toNumber() / 100).toFixed(2)}%` : undefined;

    if (app.chain.base === ChainBase.Substrate) {
      (app.chain as Substrate).chain.api.toPromise()
        .then((api) => {
          if (api.query.staking.erasStakers) {
            hasClaimablePayouts = true;
          }
        });
    }

    let valCount = globalStatistics.elected
      ? `${globalStatistics?.elected}/${globalStatistics?.count}`
      : `${Object.keys(validators).length}/${vnode.attrs.valCount}`;
    let waitingCt;

    if (validators) {
      waitingCt = Object.keys(validators).filter((v) => !validators[v].isElected && !validators[v].toBeElected).length;
    }

    return m('div.validator-preheader-container', [
      m('.validators-preheader', [
        m('.validators-preheader-item', [
          m('h3', 'Validators'),
          m('.preheader-item-text', valCount),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Waiting'),
          m('.preheader-item-text', `${waitingCt}`),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Nominators'),
          globalStatistics.nominators ?
            m('.preheader-item-text', `${globalStatistics?.nominators}`) : m('spinner', itemLoadingSpinner()),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Total Offences'),
          m('.preheader-item-text', `${globalStatistics?.offences}`),
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
          globalStatistics.aprPercentage ?
            m('.preheader-item-text', `${globalStatistics?.aprPercentage?.toFixed(2)}%`) : m('spinner', itemLoadingSpinner()),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Total Supply'),
          totalbalance ?
            m('.preheader-item-text', totalbalance?.format(true)) : m('spinner', itemLoadingSpinner()),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Total Staked'),
          totalStaked ? m('.preheader-item-text', totalStaked?.format(true)) : m('spinner', itemLoadingSpinner()),
        ]),
        m('.validators-preheader-item', [
          m('h3', 'Staked'),
          stakedPercentage ?
            m('.preheader-item-text', stakedPercentage) : m('spinner', itemLoadingSpinner()),
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
              },
              disabled: !app.user.activeAccount 
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
              },
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
              },
              disabled: !app.user.activeAccount 
            })
          ]),
        ])
      ]),
    ])
  }
});

export default SubstratePreHeader;
