import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
import useBrowserWindow from 'hooks/useBrowserWindow';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { LinkSource } from 'models/Thread';
import app from 'state';
import { useGetThreadsByLinkQuery } from 'state/api/threads';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import AddressInfo from '../../../models/AddressInfo';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { SnapshotVotesTable } from './snapshot_votes_table';

type ViewSnapshotProposalPageProps = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

export const ViewSnapshotProposalPage = ({
  identifier,
  snapshotId,
}: ViewSnapshotProposalPageProps) => {
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [power, setPower] = useState<Power | null>(null);

  const user = useUserStore();

  const { data, error, isLoading } = useGetThreadsByLinkQuery({
    communityId: app.activeChainId(),
    link: {
      source: LinkSource.Snapshot,
      // @ts-expect-error <StrictNullChecks/>
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
    user.activeAccount?.address || user.addresses?.[0]?.address;
  const activeCommunityId = app.activeChainId();
  const proposalAuthor = useMemo(() => {
    if (!proposal || !activeCommunityId) {
      return null;
    }
    return new AddressInfo({
      userId: 0, // TODO: is this OK?
      id: 0, // TODO: is this OK?
      address: proposal.author,
      communityId: activeCommunityId,
    });
  }, [proposal, activeCommunityId]);

  useManageDocumentTitle('View snapshot proposal', proposal?.title);

  const { isWindowLarge } = useBrowserWindow({});

  const loadVotes = useCallback(
    async (snapId: string, proposalId: string) => {
      await app.snapshot.init(snapId);
      if (!app.snapshot.initialized) {
        return;
      }

      const currentProposal = app.snapshot.proposals.find(
        (p) => p.id === proposalId,
      );
      // @ts-expect-error <StrictNullChecks/>
      setProposal(currentProposal);

      const currentSpace = app.snapshot.space;
      setSpace(currentSpace);

      // @ts-expect-error <StrictNullChecks/>
      const results = await getResults(currentSpace, currentProposal);
      setVoteResults(results);

      const powerRes = await getPower(
        currentSpace,
        // @ts-expect-error <StrictNullChecks/>
        currentProposal,
        activeUserAddress,
      );
      setPower(powerRes);
    },
    [activeUserAddress],
  );

  useNecessaryEffect(() => {
    loadVotes(snapshotId, identifier).catch(console.error);
  }, [identifier, loadVotes, snapshotId]);

  if (!proposal) {
    return (
      <CWPageLayout>
        <CWContentPage
          showSkeleton
          sidebarComponentsSkeletonCount={isWindowLarge ? 2 : 0}
        />
      </CWPageLayout>
    );
  }

  return (
    <CWPageLayout>
      <CWContentPage
        showSidebar
        title={proposal.title}
        // @ts-expect-error <StrictNullChecks/>
        author={proposalAuthor}
        createdAt={proposal.created}
        // @ts-expect-error <StrictNullChecks/>
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
                // @ts-expect-error <StrictNullChecks/>
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
    </CWPageLayout>
  );
};

export default ViewSnapshotProposalPage;
