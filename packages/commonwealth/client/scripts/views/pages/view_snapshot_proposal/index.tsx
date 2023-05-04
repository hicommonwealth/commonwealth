import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Power,
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
  VoteResults,
  VoteResultsData,
} from 'helpers/snapshot_utils';
import { getPower, getResults } from 'helpers/snapshot_utils';
import { AddressInfo } from 'models';

import app from 'state';
import Sublayout from 'views/sublayout';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { SnapshotVotesTable } from './snapshot_votes_table';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { LinkSource } from 'models/Thread';

type ViewProposalPageProps = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

export const ViewProposalPage = ({
  identifier,
  snapshotId,
}: ViewProposalPageProps) => {
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [power, setPower] = useState<Power | null>(null);
  const [threads, setThreads] = useState<Array<{
    id: string;
    title: string;
  }> | null>([]);

  const symbol: string = space?.symbol || '';
  const validatedAgainstStrategies: boolean = !power
    ? true
    : power.totalScore > 0;

  const totalScore: number = power?.totalScore || 0;
  const votes: SnapshotProposalVote[] = voteResults?.votes || [];
  const totals: VoteResultsData = voteResults?.results || {
    resultsByVoteBalance: [],
    resultsByStrategyScore: [],
    sumOfResultsBalance: 0,
  };

  const activeUserAddress =
    app.user?.activeAccount?.address || app.user?.addresses?.[0]?.address;
  const activeChainId = app.activeChainId();
  const proposalAuthor = useMemo(() => {
    if (!proposal || !activeChainId) {
      return null;
    }
    return new AddressInfo(null, proposal.author, activeChainId, null);
  }, [proposal, activeChainId]);

  const loadVotes = useCallback(
    async (snapId: string, proposalId: string) => {
      await app.snapshot.init(snapId);
      if (!app.snapshot.initialized) {
        return;
      }

      const currentProposal = app.snapshot.proposals.find(
        (p) => p.id === proposalId
      );
      setProposal(currentProposal);

      const currentSpace = app.snapshot.space;
      setSpace(currentSpace);

      const results = await getResults(currentSpace, currentProposal);
      setVoteResults(results);

      const powerRes = await getPower(
        currentSpace,
        currentProposal,
        activeUserAddress
      );
      setPower(powerRes);

      try {
        if (app.activeChainId()) {
          const threadsForSnapshot = await app.threads.getThreadsForLink({
            link: {
              source: LinkSource.Snapshot,
              identifier: currentProposal.id,
            },
          });
          setThreads(threadsForSnapshot);
        }
      } catch (e) {
        console.error(`Failed to fetch threads: ${e}`);
      }
    },
    [activeUserAddress]
  );

  useEffect(() => {
    loadVotes(snapshotId, identifier).catch(console.error);
  }, [identifier, loadVotes, snapshotId]);

  if (!proposal) {
    return <PageLoading />;
  }

  return (
    <Sublayout>
      <CWContentPage
        showSidebar
        title={proposal.title}
        author={
          <CWText>
            {!!proposalAuthor && (
              <User
                user={proposalAuthor}
                showAddressWithDisplayName
                linkify
                popover
              />
            )}
          </CWText>
        }
        createdAt={proposal.created}
        contentBodyLabel="Snapshot"
        subHeader={
          proposal.state === 'active' ? (
            <ActiveProposalPill proposalEnd={proposal.end} />
          ) : (
            <ClosedProposalPill proposalState={proposal.state} />
          )
        }
        body={<QuillRenderer doc={proposal.body} />}
        subBody={
          votes.length > 0 && (
            <SnapshotVotesTable
              choices={proposal.choices}
              symbol={symbol}
              voters={votes}
            />
          )
        }
        sidebarComponents={[
          {
            label: 'Info',
            item: (
              <SnapshotInformationCard proposal={proposal} threads={threads} />
            ),
          },
          {
            label: 'Poll',
            item: (
              <SnapshotPollCardContainer
                activeUserAddress={activeUserAddress}
                fetchedPower={!!power}
                identifier={identifier}
                proposal={proposal}
                scores={[]} // unused?
                space={space}
                symbol={symbol}
                totals={totals}
                totalScore={totalScore}
                validatedAgainstStrategies={validatedAgainstStrategies}
                votes={votes}
                loadVotes={async () => loadVotes(snapshotId, identifier)}
              />
            ),
          },
        ]}
      />
    </Sublayout>
  );
};

export default ViewProposalPage;
