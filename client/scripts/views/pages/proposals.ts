import 'pages/proposals.scss';

import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models/models';
import Edgeware from 'controllers/chain/edgeware/main';

import ListingPage from 'views/pages/_listing_page';
import ConvictionsTable from 'views/components/proposals/convictions_table';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { orderProposalsByAmountVoted } from 'views/components/proposals/ordering';
import { CountdownUntilBlock } from 'views/components/countdown';
import { convictionToWeight, convictionToLocktime, convictions } from 'controllers/chain/substrate/democracy';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import NewProposalModal from 'views/modals/proposals';

const ProposalsPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {'Page Name': 'ProposalsPage'});
  },
  view: (vnode) => {
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.class === ChainClass.Moloch;

    // new proposals
    const visibleMolochProposals = onMoloch && (app.chain as Moloch).governance.store.getAll()
      .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    const visibleDispatchQueue = onSubstrate && (app.chain as Substrate).democracy.store.getAll().filter((p) => !p.completed && p.passed);
    const visibleReferenda = onSubstrate && (app.chain as Substrate).democracy.store.getAll().filter((p) => !p.completed && !p.passed);

    const visibleDemocracyProposals = onSubstrate && (app.chain as Substrate).democracyProposals.store.getAll();
    const visibleCouncilProposals = onSubstrate && (app.chain as Substrate).council.store.getAll();
    const visibleSignalingProposals = (app.chain && app.chain.class === ChainClass.Edgeware) &&
      (app.chain as Edgeware).signaling.store.getAll().sort(orderProposalsByAmountVoted);
    const visibleCosmosProposals = (app.chain && app.chain.base === ChainBase.CosmosSDK) &&
      (app.chain as Cosmos).governance.store.getAll().sort((a, b) => +b.identifier - +a.identifier);
    const visibleTreasuryProposals = onSubstrate && (app.chain as Substrate).treasury.store.getAll();

    // XXX: display these
    const visibleTechnicalCommitteeProposals = app.chain && app.chain.class === ChainClass.Kusama &&
      (app.chain as Substrate).technicalCommittee.store.getAll();

    let nextReferendum;
    let nextReferendumDetail;
    if (!onSubstrate) {
      // do nothing
    } else if ((app.chain as Substrate).democracyProposals.lastTabledWasExternal) {
      if (visibleDemocracyProposals)
        [nextReferendum, nextReferendumDetail] = ['Democracy', ''];
      else
        [nextReferendum, nextReferendumDetail] = ['Council',
                                                  'Last was council, but no democracy proposal was found'];
    } else {
      if ((app.chain as Substrate).democracyProposals.nextExternal)
        [nextReferendum, nextReferendumDetail] = ['Council', ''];
      else
        [nextReferendum, nextReferendumDetail] = ['Democracy',
                                                  'Last was democracy, but no council proposal was found'];
    }

    const maxConvictionWeight = Math.max.apply(this, convictions().map((c) => convictionToWeight(c)));
    const maxConvictionLocktime = Math.max.apply(this, convictions().map((c) => convictionToLocktime(c)));
    return m(ListingPage, {
      class: 'ProposalsPage',
      title: 'Governance Proposals',
      subtitle: 'Vote on network changes',
      content: (!app.chain || !app.chain.loaded) ? m('.forum-container', m(ProposalsLoadingRow)) : [
        !visibleReferenda &&
          !visibleCouncilProposals &&
          !visibleDemocracyProposals &&
          !visibleCosmosProposals &&
          !visibleMolochProposals &&
          m('.no-proposals', 'No referenda, motions, or proposals'),
        //
        (visibleDispatchQueue.length > 0) && m('h4.proposals-subheader', 'Referenda - final voting'),
        visibleDispatchQueue && visibleDispatchQueue.map((proposal) => m(ProposalRow, { proposal })),
        //
        //
        (visibleReferenda.length > 0) && m('h4.proposals-subheader', 'Referenda - final voting'),
        visibleReferenda && visibleReferenda.map((proposal) => m(ProposalRow, { proposal })),
        //
        (visibleCouncilProposals.length > 0) && m('h4.proposals-subheader', 'Council motions'),
        visibleCouncilProposals && visibleCouncilProposals.map((proposal) => m(ProposalRow, { proposal })),
        //
        (visibleDemocracyProposals.length > 0) && m('h4.proposals-subheader', [
          'Democracy Proposed Referenda',
        ]),
        visibleDemocracyProposals &&
          visibleDemocracyProposals.map((proposal) => m(ProposalRow, { proposal })),
        //
        (visibleSignalingProposals.length > 0) && m('h4.proposals-subheader', [
          'Signaling proposals',
        ]),
        visibleSignalingProposals &&
          visibleSignalingProposals.map((proposal) => m(ProposalRow, { proposal })),
        //
        (visibleTreasuryProposals.length > 0) && m('h4.proposals-subheader', [
          'Treasury proposals',
        ]),
        visibleTreasuryProposals &&
          visibleTreasuryProposals.map((proposal) => m(ProposalRow, { proposal: proposal })),
        //
        visibleCosmosProposals && m('h4.proposals-subheader', [
          'Cosmos proposals',
        m('a.proposals-action', {
            onclick: (e) => app.modals.create({
              modal: NewProposalModal,
              data: { typeEnum: ProposalType.CosmosProposal }
            })
          }, 'New'),
        ]),
        visibleCosmosProposals && visibleCosmosProposals.map((proposal) => m(ProposalRow, { proposal })),
        //
        visibleMolochProposals && m('h4.proposals-subheader', 'DAO proposals'),
        visibleMolochProposals && visibleMolochProposals.map((proposal) => m(ProposalRow, { proposal })),
      ],
      sidebar: [
        onMoloch && m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'DAO Basics'),
          m('.stats-tile-figure-minor', [
            `Voting Period Length: ${onMoloch && (app.chain as Moloch).governance.votingPeriodLength}`
          ]),
          m('.stats-tile-figure-minor', [
            `Total Shares: ${onMoloch && (app.chain as Moloch).governance.totalShares}`
          ]),
          m('.stats-tile-figure-minor', [
            `Summoned At: ${onMoloch && (app.chain as Moloch).governance.summoningTime}`
          ]),
          m('.stats-tile-figure-minor', [
            `Proposal Count: ${onMoloch && (app.chain as Moloch).governance.proposalCount}`
          ]),
          m('.stats-tile-figure-minor', [
            `Proposal Deposit: ${onMoloch && (app.chain as Moloch).governance.proposalDeposit}`
          ]),
        ]),
        onSubstrate && m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Next referendum'),
          m('.stats-tile-figure-major', [
            onSubstrate && (app.chain as Substrate).democracyProposals.nextLaunchBlock ?
              m(CountdownUntilBlock, { block: (app.chain as Substrate).democracyProposals.nextLaunchBlock }) :
              '--'
          ]),
          m('.stats-tile-figure-minor', [
            `Block ${onSubstrate && (app.chain as Substrate).democracyProposals.nextLaunchBlock}`
          ]),
        ]),
        onSubstrate && m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Next referendum draws from'),
          m('.stats-tile-figure-major', nextReferendum),
          m('.stats-tile-figure-minor', nextReferendumDetail),
        ]),
        onSubstrate && m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Next-up council referendum'),
          m('.stats-tile-figure-major', [
            (app.chain as Substrate).democracyProposals.nextExternal ?
              //((app.chain as Substrate).democracyProposals.nextExternal[0].sectionName + '.' +
              // (app.chain as Substrate).chain.methodToTitle(
              //   (app.chain as Substrate).democracyProposals.nextExternal[0])
              //) : '--'
              (app.chain as Substrate).democracyProposals.nextExternal[0].toString() : '--'
          ]),
          m('.stats-tile-figure-minor', (app.chain as Substrate).democracyProposals.nextExternal ? [
            m('p', 'Hash: ' + (app.chain as Substrate).democracyProposals.nextExternal[0].hash.toString().slice(2, 8) + '...'),
            m('p', (app.chain as Substrate).democracyProposals.nextExternal[1].toString()),
          ] : 'None'),
        ]),
        onSubstrate && m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Next treasury spend'),
          m('.stats-tile-figure-major', [
            app.chain && (app.chain as Substrate).treasury.nextSpendBlock ?
              m(CountdownUntilBlock, { block: (app.chain as Substrate).treasury.nextSpendBlock }) :
              '--',
          ]),
          m('.stats-tile-figure-minor', `Block ${app.chain && (app.chain as Substrate).treasury.nextSpendBlock}`),
        ]),
        onSubstrate && m('.forum-container.stats-tile', [
          m('.stats-tile-label', 'Treasury balance'),
          m('.stats-tile-figure-major', app.chain && formatCoin((app.chain as Substrate).treasury.pot))
        ]),
        onSubstrate && m('.forum-container', [
          m('ul', [
            m('h4', 'Referenda'),
            m('li', [
              'Referenda are voted on by all coinholders, in a timelock-weighted yes/no vote. ',
            ]),
            m('li', [
              `If a referendum passes, winning voters' coins are locked for up to `,
              `${(app.chain as Substrate).democracy.enactmentPeriod * maxConvictionLocktime} blocks `,
              `(${formatDuration(blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod * maxConvictionLocktime))}). `,
              `Locked coins can still be staked or voted.`,
            ]),
            m('li', [
              `If a referendum is approved, it executes after a delay of `,
              `${(app.chain as Substrate).democracy.enactmentPeriod} blocks `,
              `(${formatDuration(blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod))}).`,
            ]),
            m(ConvictionsTable),
            m('h4', 'Council Motions'),
            m('li', [
              'The council can propose referenda, approve/reject treasury expenses, and ',
              'create emergency proposals/cancellations by creating council motions.'
            ]),
            m('li', [
              'Council motions are voted on by all councillors on a 1-person-1-vote basis.',
              'Motions are approved when enough councillors vote yes, or removed when enough ',
              'councillors vote no that approval becomes impossible.',
            ]),
            m('h4', 'Democracy Proposals'),
            m('li', [
              `Any coinholder can propose a referendum, by placing a bond of at least `,
              `${app.chain && formatCoin((app.chain as Substrate).democracyProposals.minimumDeposit)}. `,
            ]),
            m('li', [
              'Anyone can second the proposal in amounts equal to the original bond, as many times as they wish.',
            ]),
          ]),
        ]),
      ],
    });
  }
};

export default ProposalsPage;
