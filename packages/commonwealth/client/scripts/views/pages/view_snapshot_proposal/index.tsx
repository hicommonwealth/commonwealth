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
import { notifyError } from '../../../controllers/app/notifications';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import AddressInfo from '../../../models/AddressInfo';
import { useGetThreadsByLinkQuery } from '../../../state/api/threads/index';
import { CWContentPage } from '../../components/component_kit/CWContentPage/index';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { PageLoading } from '../loading';
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { SnapshotVotesTable } from './snapshot_votes_table';

export function useSnapshotProposalData(snapshotProposalId, snapshotId) {
  const [snapshotProposal, setSnapshotProposal] =
    useState<SnapshotProposal | null>(null);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [power, setPower] = useState<Power | null>(null);

  const { data, error, isLoading } = useGetThreadsByLinkQuery({
    chainId: app.activeChainId(),
    link: {
      source: LinkSource.Snapshot,
      identifier: snapshotProposal?.id,
    },
    enabled: !!(app.activeChainId() && snapshotProposal?.id),
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
    if (!snapshotProposal || !activeChainId) {
      return null;
    }
    return new AddressInfo(null, snapshotProposal.author, activeChainId, null);
  }, [activeChainId, snapshotProposal]);

  useManageDocumentTitle('View snapshot proposal', snapshotProposal?.title);

  const loadVotes = useCallback(
    async (snapId: string, proposalId: string) => {
      if (!snapId) {
        return;
      }
      await app.snapshot.init(snapId);
      if (!app.snapshot.initialized) {
        return;
      }

      const currentProposal = app.snapshot.proposals.find(
        (p) => p.id === proposalId
      );

      setSnapshotProposal(currentProposal);

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
    loadVotes(snapshotId, snapshotProposalId).catch(console.error);
  }, [snapshotId, snapshotProposalId]);

  return {
    snapshotProposal,
    proposalAuthor,
    votes,
    symbol,
    threads,
    activeUserAddress,
    power,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    loadVotes,
  };
}

type ViewProposalPageProps = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

export const ViewProposalPage = ({
  identifier,
  snapshotId,
}: ViewProposalPageProps) => {
  const {
    snapshotProposal,
    proposalAuthor,
    votes,
    symbol,
    threads,
    activeUserAddress,
    power,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    loadVotes,
  } = useSnapshotProposalData(identifier, snapshotId);

  if (!snapshotProposal) {
    return <PageLoading />;
  }

  return (
    <CWContentPage
      showSidebar
      title={snapshotProposal.title}
      author={proposalAuthor}
      createdAt={snapshotProposal.created}
      updatedAt={null}
      contentBodyLabel="Snapshot"
      subHeader={
        snapshotProposal.state === 'active' ? (
          <ActiveProposalPill proposalEnd={snapshotProposal.end} />
        ) : (
          <ClosedProposalPill proposalState={snapshotProposal.state} />
        )
      }
      body={() => <QuillRenderer doc={snapshotProposal.body} />}
      subBody={
        votes.length > 0 && (
          <SnapshotVotesTable
            choices={snapshotProposal.choices}
            symbol={symbol}
            voters={votes}
          />
        )
      }
      sidebarComponents={[
        {
          label: 'Info',
          item: (
            <SnapshotInformationCard
              proposal={snapshotProposal}
              threads={threads}
            />
          ),
        },
        {
          label: 'Poll',
          item: (
            <SnapshotPollCardContainer
              activeUserAddress={activeUserAddress}
              fetchedPower={!!power}
              identifier={identifier}
              proposal={snapshotProposal}
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
