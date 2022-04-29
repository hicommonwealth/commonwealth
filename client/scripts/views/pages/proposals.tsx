/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Button, Tag } from 'construct-ui';
import BN from 'bn.js';

import 'pages/proposals.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ChainBase, ChainNetwork } from 'types';
import { ProposalModule } from 'models';

import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import Aave from 'controllers/chain/ethereum/aave/adapter';

import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card/proposal_card';
import { CountdownUntilBlock } from 'views/components/countdown';
import loadSubstrateModules from 'views/components/load_substrate_modules';

import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { AaveProposalCardDetail } from '../components/proposals/aave_proposal_card_detail';
import { CardsCollection } from '../components/cards_collection';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: () => {
    if (!app.chain) return;

    return m('.stats-box', [
      m('.stats-box-left', '💭'),
      m('.stats-box-right', [
        m('', [
          m('strong', 'Democracy Proposals'),
          m('span', [
            ' can be introduced by anyone. ',
            'At a regular interval, the top ranked proposal will become a supermajority-required referendum.',
          ]),
          m('p', [
            m('strong', 'Council Motions'),
            m('span', [
              ' can be introduced by councillors. They can directly approve/reject treasury proposals, ',
              'propose simple-majority referenda, or create fast-track referenda.',
            ]),
          ]),
        ]),
        m('', [
          m('.stats-box-stat', [
            'Next proposal or motion becomes a referendum: ',
            (app.chain as Substrate).democracyProposals.nextLaunchBlock
              ? m(CountdownUntilBlock, {
                  block: (app.chain as Substrate).democracyProposals
                    .nextLaunchBlock,
                  includeSeconds: false,
                })
              : '--',
          ]),
        ]),
      ]),
    ]);
  },
};

const CompoundProposalStats: m.Component<{}, {}> = {
  view: () => {
    if (!app.chain) return;
    if (!(app.chain instanceof Compound)) return;

    const symbol = app.chain.meta.chain.symbol;

    return m('.stats-box', [
      m('.stats-box-left', '💭'),
      m('.stats-box-right', [
        m('', [
          m('strong', 'Compound Proposals'),
          m('span', [
            '', // TODO: fill in
          ]),
        ]),
        m('', [
          // TODO: We shouldn't be hardcoding these decimal amounts
          m('.stats-box-stat', [
            `Quorum: ${app.chain.governance?.quorumVotes
              .div(new BN('1000000000000000000'))
              .toString()} ${symbol}`,
          ]),
          app.chain.governance?.proposalThreshold &&
            m('.stats-box-stat', [
              `Proposal Threshold: ${app.chain.governance?.proposalThreshold
                .div(new BN('1000000000000000000'))
                .toString()} ${symbol}`,
            ]),
          m('.stats-box-stat', [
            `Voting Period Length: ${app.chain.governance.votingPeriod.toString(
              10
            )}`,
          ]),
        ]),
        m(Button, {
          intent: 'primary',
          onclick: () => navigateToSubpage('/new/proposal'),
          label: 'New proposal',
        }),
      ]),
    ]);
  },
};

function getModules(): ProposalModule<any, any, any>[] {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [
      chain.council,
      chain.technicalCommittee,
      chain.treasury,
      chain.democracyProposals,
      chain.democracy,
    ];
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    const chain = app.chain as Cosmos;
    return [chain.governance];
  } else {
    throw new Error('invalid chain');
  }
}

const ProposalsPage: m.Component<{}> = {
  oncreate: () => {
    mixpanel.track('PageVisit', { 'Page Name': 'ProposalsPage' });
    const returningFromThread =
      app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/');
    if (
      returningFromThread &&
      localStorage[`${app.activeChainId()}-proposals-scrollY`]
    ) {
      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${app.activeChainId()}-proposals-scrollY`])
        );
      }, 100);
    }
  },
  view: () => {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: [
            'Proposals',
            m(Tag, {
              size: 'xs',
              label: 'Beta',
              style: 'position: relative; top: -2px; margin-left: 6px',
            }),
          ],
        });
      }
      if (app.chain?.failed)
        return m(PageNotFound, {
          title: 'Wrong Ethereum Provider Network!',
          message: 'Change Metamask to point to Ethereum Mainnet',
        });
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Proposals',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      });
    }

    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.network === ChainNetwork.Moloch;
    const onCompound = app.chain && app.chain.network === ChainNetwork.Compound;
    const onAave = app.chain && app.chain.network === ChainNetwork.Aave;
    const onSputnik = app.chain && app.chain.network === ChainNetwork.Sputnik;

    const modLoading = loadSubstrateModules('Proposals', getModules);
    if (modLoading) return modLoading;

    // active proposals
    const activeDemocracyProposals =
      onSubstrate &&
      (app.chain as Substrate).democracyProposals.store
        .getAll()
        .filter((p) => !p.completed);
    const activeCouncilProposals =
      onSubstrate &&
      (app.chain as Substrate).council.store
        .getAll()
        .filter((p) => !p.completed);
    const activeCosmosProposals =
      app.chain &&
      app.chain.base === ChainBase.CosmosSDK &&
      (app.chain as Cosmos).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((a, b) => +b.identifier - +a.identifier);
    const activeMolochProposals =
      onMoloch &&
      (app.chain as Moloch).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);
    const activeCompoundProposals =
      onCompound &&
      (app.chain as Compound).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);
    const activeAaveProposals =
      onAave &&
      (app.chain as Aave).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => +p2.startBlock - +p1.startBlock);
    const activeSputnikProposals =
      onSputnik &&
      (app.chain as NearSputnik).dao.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => p2.data.id - p1.data.id);

    const activeProposalContent =
      !activeDemocracyProposals?.length &&
      !activeCouncilProposals?.length &&
      !activeCosmosProposals?.length &&
      !activeMolochProposals?.length &&
      !activeCompoundProposals?.length &&
      !activeAaveProposals?.length &&
      !activeSputnikProposals?.length
        ? [m('.no-proposals', 'No active proposals')]
        : [
            m('.active-proposals', [
              (activeDemocracyProposals || [])
                .map((proposal) => <ProposalCard proposal={proposal} />)
                .concat(
                  (activeCouncilProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (activeCosmosProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (activeMolochProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (activeCompoundProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (activeAaveProposals || []).map((proposal) => (
                    <ProposalCard
                      proposal={proposal}
                      injectedContent={AaveProposalCardDetail}
                    />
                  ))
                )
                .concat(
                  (activeSputnikProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                ),
            ]),
          ];

    // inactive proposals
    const inactiveDemocracyProposals =
      onSubstrate &&
      (app.chain as Substrate).democracyProposals.store
        .getAll()
        .filter((p) => p.completed);
    const inactiveCouncilProposals =
      onSubstrate &&
      (app.chain as Substrate).council.store
        .getAll()
        .filter((p) => p.completed);
    const inactiveCosmosProposals =
      app.chain &&
      app.chain.base === ChainBase.CosmosSDK &&
      (app.chain as Cosmos).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((a, b) => +b.identifier - +a.identifier);
    const inactiveMolochProposals =
      onMoloch &&
      (app.chain as Moloch).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);
    const inactiveCompoundProposals =
      onCompound &&
      (app.chain as Compound).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);
    const inactiveAaveProposals =
      onAave &&
      (app.chain as Aave).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => +p2.startBlock - +p1.startBlock);
    const inactiveSputnikProposals =
      onSputnik &&
      (app.chain as NearSputnik).dao.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => p2.data.id - p1.data.id);

    const inactiveProposalContent =
      !inactiveDemocracyProposals?.length &&
      !inactiveCouncilProposals?.length &&
      !inactiveCosmosProposals?.length &&
      !inactiveMolochProposals?.length &&
      !inactiveCompoundProposals?.length &&
      !inactiveAaveProposals?.length &&
      !inactiveSputnikProposals?.length
        ? [m('.no-proposals', 'No past proposals')]
        : [
            m('.inactive-proposals', [
              (inactiveDemocracyProposals || [])
                .map((proposal) => <ProposalCard proposal={proposal} />)
                .concat(
                  (inactiveCouncilProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (inactiveCosmosProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (inactiveMolochProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (inactiveCompoundProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                )
                .concat(
                  (inactiveAaveProposals || []).map((proposal) => (
                    <ProposalCard
                      proposal={proposal}
                      injectedContent={AaveProposalCardDetail}
                    />
                  ))
                )
                .concat(
                  (inactiveSputnikProposals || []).map((proposal) => (
                    <ProposalCard proposal={proposal} />
                  ))
                ),
            ]),
          ];

    return m(
      Sublayout,
      {
        title: [
          'Proposals',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      },
      m('.ProposalsPage', [
        onSubstrate && m(SubstrateProposalStats),
        onCompound && m(CompoundProposalStats),
        m('.clear'),
        m(CardsCollection, {
          content: activeProposalContent,
          header: 'Active',
        }),
        m('.clear'),
        m(CardsCollection, {
          content: inactiveProposalContent,
          header: 'Inactive',
        }),
        m('.clear'),
      ])
    );
  },
};

export default ProposalsPage;
