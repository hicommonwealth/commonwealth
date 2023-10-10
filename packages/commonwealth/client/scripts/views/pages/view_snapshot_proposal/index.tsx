import React from 'react';
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
import { useSnapshotProposalData } from './useSnapshotProposalData';

type ViewSnapshotProposalPageProps = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

export const ViewSnapshotProposalPage = ({
  identifier,
  snapshotId,
}: ViewSnapshotProposalPageProps) => {
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

export default ViewSnapshotProposalPage;
