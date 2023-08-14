import { notifyError } from 'controllers/app/notifications';
import {
  getPower,
  getResults,
  Power,
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
  VoteResults,
  VoteResultsData,
} from 'helpers/snapshot_utils';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { LinkSource } from 'models/Thread';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useGetThreadsByLinkQuery } from 'state/api/threads';
import AddressInfo from '../../../models/AddressInfo';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { PageLoading } from '../loading';
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { SnapshotVotesTable } from './snapshot_votes_table';

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

  const { data, error, isLoading } = useGetThreadsByLinkQuery({
    chainId: app.activeChainId(),
    link: {
      source: LinkSource.Snapshot,
      identifier: proposal?.id,
    },
    enabled: !!(app.activeChainId() && proposal?.id),
  });
  const threads = data || [];

  useEffect(() => {
    if (!isLoading && error) {
      notifyError('Could not get threads');
    }
  }, [error, isLoading]);

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
    },
    [activeUserAddress]
  );

  useNecessaryEffect(() => {
    loadVotes(snapshotId, identifier).catch(console.error);
  }, [identifier, loadVotes, snapshotId]);

  if (!proposal) {
    return <PageLoading />;
  }

  return (
    <CWContentPage
      showSidebar
      title={proposal.title}
      author={proposalAuthor}
      createdAt={proposal.created}
      updatedAt={null}
      contentBodyLabel="Snapshot"
      subHeader={
        proposal.state === 'active' ? (
          <ActiveProposalPill proposalEnd={proposal.end} />
        ) : (
          <ClosedProposalPill proposalState={proposal.state} />
        )
      }
      body={() => <QuillRenderer doc={proposal.body} />}
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
  );
};

export default ViewProposalPage;
