import React from 'react';

import { MixpanelSnapshotEvents } from 'analytics/types';
import type {
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import { getPower, getResults } from 'helpers/snapshot_utils';
import { AddressInfo } from 'models';
import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';

// import 'pages/snapshot/index.scss';
import app from 'state';
import Sublayout from 'views/sublayout';
// import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { SnapshotVotesTable } from './snapshot_votes_table';

type ViewProposalPageAttrs = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

class ViewProposalPage extends ClassComponent<ViewProposalPageAttrs> {
  private fetchedPower: boolean;
  private proposal: SnapshotProposal;
  private scores: Array<number>;
  private space: SnapshotSpace;
  private symbol: string;
  private threads: Array<{ id: string; title: string }> | null;
  private totals: any;
  private totalScore: number;
  private validatedAgainstStrategies: boolean;
  private votes: Array<SnapshotProposalVote>;

  oninit(vnode: ResultNode<ViewProposalPageAttrs>) {
    this.fetchedPower = false;
    this.proposal = null;
    this.scores = [];
    this.threads = null;
    this.validatedAgainstStrategies = true;
    this.votes = [];

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

      redraw();

      getPower(
        this.space,
        this.proposal,
        app.user?.activeAccount?.address
      ).then((vals) => {
        this.validatedAgainstStrategies = vals.totalScore > 0;
        this.totalScore = vals.totalScore;
        this.fetchedPower = true;
        redraw();
      });

      try {
        if (app.activeChainId()) {
          app.threads
            .fetchThreadIdsForSnapshot({ snapshot: this.proposal.id })
            .then((res) => {
              this.threads = res;
              redraw();
            });
        }
      } catch (e) {
        console.error(`Failed to fetch threads: ${e}`);
      }
    };

    // const mixpanelTrack = () => {
    //   mixpanelBrowserTrack({
    //     event: MixpanelSnapshotEvents.SNAPSHOT_PROPOSAL_VIEWED,
    //     isCustomDomain: app.isCustomDomain(),
    //     space: app.snapshot.space.id,
    //   });
    // };

    const snapshotId = vnode.attrs.snapshotId;

    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => {
        // mixpanelTrack();
        loadVotes();
      });
    } else {
      // mixpanelTrack();
      loadVotes();
    }
  }

  view(vnode: ResultNode<ViewProposalPageAttrs>) {
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
          author={
            <CWText>
              {!!app.activeChainId() && (
                <User
                  user={
                    new AddressInfo(
                      null,
                      this.proposal.author,
                      app.activeChainId(),
                      null
                    )
                  }
                  showAddressWithDisplayName
                  linkify
                  popover
                />
              )}
            </CWText>
          }
          createdAt={this.proposal.created}
          contentBodyLabel="Snapshot"
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
                voters={this.votes}
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
