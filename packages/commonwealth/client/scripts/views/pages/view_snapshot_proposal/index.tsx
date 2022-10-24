/* @jsx m */

import m from 'mithril';

import 'pages/snapshot/index.scss';

import app from 'state';
import { MixpanelSnapshotEvents } from 'analytics/types';
import Sublayout from 'views/sublayout';
import {
  SnapshotSpace,
  SnapshotProposal,
  SnapshotProposalVote,
  getResults,
  getPower,
} from 'helpers/snapshot_utils';
import { PageLoading } from '../loading';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { SnapshotInformationCard } from './snapshot_information_card';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { SnapshotVotesTable } from './snapshot_votes_table';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';

type ViewProposalPageAttrs = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

class ViewProposalPage implements m.ClassComponent<ViewProposalPageAttrs> {
  private activeTab: 'proposals' | 'info-and-results';
  private proposal: SnapshotProposal;
  private scores: number[];
  private space: SnapshotSpace;
  private symbol: string;
  private threads: Array<{ id: string; title: string }> | null;
  private totals: any;
  private votes: SnapshotProposalVote[];
  private fetchedPower: boolean;
  private validatedAgainstStrategies: boolean;
  private totalScore: number;

  oninit(vnode) {
    this.activeTab = 'proposals';
    this.votes = [];
    this.scores = [];
    this.proposal = null;
    this.threads = null;
    this.fetchedPower = false;
    this.validatedAgainstStrategies = true;

    const loadVotes = async () => {
      this.proposal = app.snapshot.proposals.find(
        (proposal) => proposal.id === vnode.attrs.identifier
      );

      const space = app.snapshot.space;
      this.space = space;
      this.symbol = space.symbol;

      await getResults(space, this.proposal).then((res) => {
        this.votes = res.votes;
        this.totals = res.results;
      });

      m.redraw();

      getPower(
        this.space,
        this.proposal,
        app.user?.activeAccount?.address
      ).then((vals) => {
        this.validatedAgainstStrategies = vals.totalScore > 0;
        this.totalScore = vals.totalScore;
        this.fetchedPower = true;
        m.redraw();
      });

      try {
        app.threads
          .fetchThreadIdsForSnapshot({ snapshot: this.proposal.id })
          .then((res) => {
            this.threads = res;
            m.redraw();
          });
      } catch (e) {
        console.error(`Failed to fetch threads: ${e}`);
      }
    };

    const mixpanelTrack = () => {
      mixpanelBrowserTrack({
        event: MixpanelSnapshotEvents.SNAPSHOT_PROPOSAL_VIEWED,
        isCustomDomain: app.isCustomDomain(),
        space: app.snapshot.space.id,
      });
    };

    const snapshotId = vnode.attrs.snapshotId;

    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => {
        mixpanelTrack();
        loadVotes();
      });
    } else {
      mixpanelTrack();
      loadVotes();
    }

    window.onresize = () => {
      if (
        isWindowMediumSmallInclusive(window.innerWidth) &&
        this.activeTab !== 'proposals'
      ) {
        this.activeTab = 'proposals';
        m.redraw();
      }
    };
  }

  view(vnode) {
    const { identifier } = vnode.attrs;

    return !this.votes || !this.totals || !this.proposal ? (
      <PageLoading />
    ) : (
      <Sublayout
      // title="Snapshot Proposal"
      >
        <CWContentPage
          showSidebar
          title={this.proposal.title}
          author={this.proposal.author}
          createdAt={this.proposal.created}
          subHeader={
            this.proposal.state === 'active' ? (
              <ActiveProposalPill proposalEnd={this.proposal.end} />
            ) : (
              <ClosedProposalPill proposalState={this.proposal.state} />
            )
          }
          body={renderQuillTextBody(this.proposal.body)}
          subBody={
            this.votes.length > 0 && (
              <SnapshotVotesTable
                choices={this.proposal.choices}
                symbol={this.symbol}
                votes={this.votes}
              />
            )
          }
          sidebarComponents={[
            {
              label: 'Info',
              item: (
                <SnapshotInformationCard
                  proposal={this.proposal}
                  threads={this.threads}
                />
              ),
            },
            {
              label: 'Poll',
              item: (
                <SnapshotPollCardContainer
                  fetchedPower={this.fetchedPower}
                  identifier={identifier}
                  proposal={this.proposal}
                  scores={this.scores}
                  space={this.space}
                  symbol={this.symbol}
                  totals={this.totals}
                  totalScore={this.totalScore}
                  validatedAgainstStrategies={this.validatedAgainstStrategies}
                  votes={this.votes}
                />
              ),
            },
          ]}
        />
      </Sublayout>
    );
  }
}

export default ViewProposalPage;
