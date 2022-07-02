/* @jsx m */

import m from 'mithril';

import { Tabs, TabItem } from 'construct-ui';
import moment from 'moment';

import 'pages/snapshot/index.scss';

import app from 'state';
import { MixpanelSnapshotEvents } from 'analytics/types';
import Sublayout from 'views/sublayout';
import {
  SnapshotSpace,
  SnapshotProposal,
  SnapshotProposalVote,
  getResults,
} from 'helpers/snapshot_utils';
import { PageLoading } from '../loading';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';
import { SnapshotVoteAction } from './snapshot_vote_action';
import { SnapshotVotingResults } from './snapshot_voting_results';
import { SnapshotInformation } from './snapshot_information';
import { SnapshotProposalContent } from './snapshot_proposal_content';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';

type ViewProposalPageAttrs = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

class ViewProposalPage implements m.ClassComponent<ViewProposalPageAttrs> {
  private activeTab: string;
  private proposal: SnapshotProposal;
  private scores: number[];
  private space: SnapshotSpace;
  private symbol: string;
  private threads: Array<{ id: string; title: string }> | null;
  private totals: any;
  private votes: SnapshotProposalVote[];

  oninit(vnode) {
    this.activeTab = 'Proposals';
    this.votes = [];
    this.scores = [];
    this.proposal = null;
    this.threads = null;

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
        this.activeTab !== 'Proposals'
      ) {
        this.activeTab = 'Proposals';
        m.redraw();
      }
    };
  }

  view(vnode) {
    const author = app.user.activeAccount;
    const { proposal, votes, activeTab, threads } = this;

    const isActive =
      this.proposal &&
      moment(+this.proposal.start * 1000) <= moment() &&
      moment(+this.proposal.end * 1000) > moment();

    return !this.votes || !this.totals || !this.proposal ? (
      <PageLoading />
    ) : (
      <Sublayout title="Snapshot Proposal">
        <div
          class={`SnapshotViewProposalPage ${
            activeTab === 'Proposals' ? 'proposal-tab' : 'info-tab'
          }`}
        >
          <Tabs align="left" class="snapshot-tabs">
            <TabItem
              label="Proposals"
              active={activeTab === 'Proposals'}
              onclick={() => {
                this.activeTab = 'Proposals';
              }}
            />
            <TabItem
              label="Info & Results"
              active={activeTab === 'Info & Results'}
              onclick={() => {
                this.activeTab = 'Info & Results';
              }}
            />
          </Tabs>
          <div class="proposal-body">
            {activeTab !== 'Info & Results' && (
              <div class="proposal-content">
                <SnapshotProposalContent
                  proposal={proposal}
                  votes={votes}
                  symbol={this.symbol}
                />
              </div>
            )}
            <div class="proposal-info">
              <SnapshotInformation proposal={proposal} threads={threads} />
              {isActive && author && (
                <SnapshotVoteAction
                  space={this.space}
                  proposal={this.proposal}
                  id={vnode.attrs.identifier}
                  scores={this.scores}
                  choices={this.proposal.choices}
                  votes={this.votes}
                />
              )}
              <SnapshotVotingResults
                choices={this.proposal.choices}
                votes={this.votes}
                totals={this.totals}
                symbol={this.symbol}
              />
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewProposalPage;
