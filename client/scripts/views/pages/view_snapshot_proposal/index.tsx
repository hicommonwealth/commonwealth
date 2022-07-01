/* @jsx m */

import m from 'mithril';

import { Tabs, TabItem } from 'construct-ui';
import moment from 'moment';

import 'pages/snapshot/index.scss';
import 'pages/snapshot/list_proposal.scss';

import app from 'state';
import { MixpanelSnapshotEvents } from 'analytics/types';
import Sublayout from 'views/sublayout';
import { AddressInfo } from 'models';
import {
  SnapshotSpace,
  SnapshotProposal,
  SnapshotProposalVote,
  getResults,
} from 'helpers/snapshot_utils';
import { formatNumberLong, formatTimestamp } from 'helpers';
import User from '../../components/widgets/user';
import { MarkdownFormattedText } from '../../components/markdown_formatted_text';
import { PageLoading } from '../loading';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ProposalHeaderSnapshotThreadLink } from '../view_proposal/proposal_header_links';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';
import { VoteAction } from './vote_action';
import { SnapshotVotingResults } from './snapshot_voting_results';

type ProposalContentAttrs = {
  proposal: SnapshotProposal;
  symbol: string;
  votes: SnapshotProposalVote[];
};

class ProposalContent implements m.ClassComponent<ProposalContentAttrs> {
  private votersListExpanded: boolean;

  oncreate() {
    this.votersListExpanded = false;
  }

  view(vnode) {
    const { proposal, votes, symbol } = vnode.attrs;

    const votersList = this.votersListExpanded ? votes : votes.slice(0, 10);

    return (
      <>
        <div class="snapshot-proposal-title">{proposal.title}</div>
        <div class="snapshot-proposal-hash">#${proposal.ipfs}</div>
        <div class="snapshot-proposals-list">
          <div class="other-details">
            <div class="submitted-by">submitted by</div>
            <div class="author-address">
              {m(User, {
                user: new AddressInfo(
                  null,
                  proposal.author,
                  app.activeChainId(),
                  null
                ),
                linkify: true,
                popover: true,
              })}
            </div>
            {proposal.state === 'active' ? (
              <div class="active-proposal">
                <span>
                  Ends in ${formatTimestamp(moment(+proposal.end * 1000))}
                </span>
                <div class="active-text">Active</div>
              </div>
            ) : (
              <div class="closed-proposal">{proposal.state}</div>
            )}
          </div>
        </div>
        <div class="ProposalBodyText">
          <MarkdownFormattedText doc={proposal.body} />
        </div>
        {votes.length > 0 && (
          <>
            <div class="votes-title">
              <div class="title">Votes</div>
              <div class="vote-count">{votes.length}</div>
            </div>
            <div class="votes-container">
              <div class="t-head">
                <div class="user-column">User</div>
                <div class="user-column">Vote</div>
                <div class="user-column">Power</div>
              </div>
              {votersList.map((vote) => (
                <div class="vote-row">
                  <div class="user-column">
                    {m(User, {
                      user: new AddressInfo(
                        null,
                        vote.voter,
                        app.activeChainId(),
                        null
                      ),
                      linkify: true,
                      popover: true,
                    })}
                  </div>
                  <div class="vote-column">
                    {proposal.choices[vote.choice - 1]}
                  </div>
                  <div class="power-column">
                    ${formatNumberLong(vote.balance)} ${symbol}
                  </div>
                </div>
              ))}
              <button
                class="view-more-button"
                onclick={() => {
                  this.votersListExpanded = true;
                  m.redraw();
                }}
              >
                VIEW MORE
              </button>
            </div>
          </>
        )}
      </>
    );
  }
}

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

  oncreate() {
    mixpanelBrowserTrack({
      event: MixpanelSnapshotEvents.SNAPSHOT_PROPOSAL_VIEWED,
      isCustomDomain: app.isCustomDomain(),
      space: app.snapshot.space.id,
    });
  }

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

    const snapshotId = vnode.attrs.snapshotId;
    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => {
        loadVotes();
      });
    } else {
      loadVotes();
    }

    window.onresize = () => {
      if (window.innerWidth > 1024 && this.activeTab !== 'Proposals') {
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
                <ProposalContent
                  proposal={proposal}
                  votes={votes}
                  symbol={this.symbol}
                />
              </div>
            )}
            <div class="proposal-info">
              <div class="proposal-info-box">
                <div class="title">Information</div>
                <div class="info-block">
                  <div class="labels">
                    <p>Author</p>
                    <p>IPFS</p>
                    <p>Voting System</p>
                    <p>Start Date</p>
                    <p>End Date</p>
                    <p>
                      {proposal.strategies.length > 1
                        ? 'Strategies'
                        : 'Strategy'}
                    </p>
                    <p>Snapshot</p>
                  </div>
                  <div class="values">
                    {m(User, {
                      user: new AddressInfo(
                        null,
                        proposal.author,
                        app.activeChainId(),
                        null
                      ),
                      linkify: true,
                      popover: true,
                    })}
                    <a
                      class="snapshot-link -mt-10"
                      href={`https://ipfs.fleek.co/ipfs/${proposal.ipfs}`}
                      target="_blank"
                    >
                      <div class="truncate">#{proposal.ipfs}</div>
                      <CWIcon iconName="externalLink" iconSize="small" />
                    </a>
                    <div class="snapshot-type">
                      {proposal.type.split('-').join(' ').concat(' voting')}
                    </div>
                    <p>{moment(+proposal.start * 1000).format('lll')}</p>
                    <p>{moment(+proposal.end * 1000).format('lll')}</p>
                    <a
                      class="snapshot-link"
                      href={`https://snapshot.org/#/${app.snapshot.space.id}/proposal/${proposal.id}`}
                      target="_blank"
                    >
                      <div class="truncate">
                        {proposal.strategies.length > 1
                          ? `${proposal.strategies.length} Strategies`
                          : proposal.strategies[0].name}
                      </div>
                      <CWIcon iconName="externalLink" iconSize="small" />
                    </a>
                    <a
                      class="snapshot-link"
                      href={`https://etherscan.io/block/${proposal.snapshot}`}
                      target="_blank"
                    >
                      <div class="truncate">#{proposal.snapshot}</div>
                      <CWIcon iconName="externalLink" iconSize="small" />
                    </a>
                  </div>
                </div>
                {threads !== null && (
                  <div class="linked-discussion">
                    <div class="heading-2">Linked Discussions</div>
                    {threads.map((thread) => (
                      <ProposalHeaderSnapshotThreadLink thread={thread} />
                    ))}
                  </div>
                )}
              </div>
              {/* {isActive && author && ( */}
              <VoteAction
                space={this.space}
                proposal={this.proposal}
                id={vnode.attrs.identifier}
                scores={this.scores}
                choices={this.proposal.choices}
                votes={this.votes}
              />
              {/* )} */}
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
