import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import { DeriveSessionProgress } from '@polkadot/api-derive/types';
import { formatNumber } from '@polkadot/util';
import ManageStakingModal from './manage_staking';
import ClaimPayoutModal from './claim_payout';
import CardSummary from './card_summary';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { makeDynamicComponent } from 'models/mithril';


const offence = {
    count: null,
    setCount(offences) {
        offence.count = offences.length;
        m.redraw();
    }
};
interface IPreHeaderState {
    dynamic: {
        sessionInfo: DeriveSessionProgress;
        globalStatistics: any,
        sender: SubstrateAccount
    },
}

export const PreHeader_ = makeDynamicComponent<{}, IPreHeaderState>({
    oncreate: async (vnode) => {
        vnode.state.dynamic.globalStatistics = await app.staking.globalStatistics();
        vnode.state.dynamic.sender = app.user.activeAccount as SubstrateAccount;
        const offences = await app.chainEvents.offences();
        offence.setCount(offences);
    },
    getObservables: (attrs) => ({
        // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
        groupKey: app.chain.class.toString(),
        sessionInfo: (app.chain.base === ChainBase.Substrate)
            ? (app.chain as Substrate).staking.sessionInfo
            : null
    }),
    view: vnode => {
        let { sessionInfo, globalStatistics, sender } = vnode.state.dynamic;
        if (!sessionInfo && !globalStatistics) return;
        // console.log("globalStatistics ", JSON.stringify(globalStatistics));
        let { count = 0, rows = [] } = globalStatistics;
        let apr = 0.0;
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

        rows.forEach((stats) => {
            let { exposure = {}, isElected = false } = stats;
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
            // console.log("nominators ===== ", nominators);
            // count elected and waiting validators
            if (isElected) {
                elected++;
            } else {
                waiting++;
            }
            // calculate est. apr
            apr += stats.apr;
        });
        apr = apr / count;
        const totalbalance = (app.chain as Substrate).chain.totalbalance;
        const staked = `${(totalStaked.muln(10000).div(totalbalance).toNumber() / 100).toFixed(2)}%`;

        return [
            m('.validators-preheader', [
                m('.validators-preheader-item', [
                    m('h3', 'Validators'),
                    m('.preheader-item-text', `${elected}/${validatorCount.toHuman()}`),
                    //m('.preheader-item-text', `${elected}/${count}`), -- if count coming from db
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
                m('.validators-preheader-item', [
                    m('h3', 'Update nominations'),
                    m('.preheader-item-text', [
                        m('a.btn.formular-button-primary', {
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
                        }, 'Update'),
                    ]),
                ]),
            ])
        ];
    }
})



export default PreHeader_;



// console.log("validator details ", vnode.state.validatorDetails);
// return m("section.anunturi.mb-4", [

//     statistics ? statistics.rows.map(stats => {
// return m("span", "Statistics : \n" + JSON.stringify(stats, undefined, 2))
//     }) : "Waiting for data...",
// m("button", { class: "btn", onclick: app.staking.globalStatistics() }, "      Show more")
// ])
/*
interface IValidators {
    "id": number,
    "stash_id": AccountId,
    "block": string,
    "exposure": Exposure[],
    "commission": string,
    "preferences": number,
    "apr": string,
    "uptime": string,
    "movingAverages": number,
    "isLatest": Boolean,
    "hasMessage": Boolean,
    "isOnline": Boolean,
    "eraPoints": number,
    "isElected": Boolean,
    "toBeElected": false,
    "createdAt": string,
    "updatedAt": string,
    "Validator": IValidatorModel
}
interface IValidatorModel {
    "stash": AccountId,
    "controller": AccountId,
    "sessionKeys": AccountId[],
    "state": string,
    "lastUpdate": BlockNumber,
    "createdAt": string,
    "updatedAt": string,
}
*/