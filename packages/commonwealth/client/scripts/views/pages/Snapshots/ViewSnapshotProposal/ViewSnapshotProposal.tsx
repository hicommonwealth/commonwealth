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
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import AddressInfo from 'models/AddressInfo';
import { LinkSource } from 'models/Thread';
import app from 'state';
import {
  useGetSnapshotProposalsQuery,
  useGetSnapshotSpaceQuery,
} from 'state/api/snapshots';
import { useGetThreadsByLinkQuery } from 'state/api/threads';
import useUserStore from 'state/ui/user';
import { CWContentPage } from 'views/components/component_kit/CWContentPage';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from 'views/components/proposal_pills';
import { SnapshotInformationCard } from 'views/pages/Snapshots/ViewSnapshotProposal/SnapshotInformationCard';
import { SnapshotPollCardContainer } from 'views/pages/Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { SnapshotVotesTable } from 'views/pages/Snapshots/ViewSnapshotProposal/SnapshotVotesTable';

type ViewSnapshotProposalProps = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

const ViewSnapshotProposal = ({
  identifier,
  snapshotId,
}: ViewSnapshotProposalProps) => {
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [power, setPower] = useState<Power | null>(null);

  const user = useUserStore();

  const { data, error, isLoading } = useGetThreadsByLinkQuery({
    communityId: app.activeChainId() || '',
    link: {
      source: LinkSource.Snapshot,
      // @ts-expect-error <StrictNullChecks/>
      identifier: proposal?.id,
    },
    enabled: !!(app.activeChainId() && proposal?.id),
  });

  const { data: spaceData } = useGetSnapshotSpaceQuery({ space: snapshotId });
  const { data: proposalsData } = useGetSnapshotProposalsQuery({
    space: snapshotId,
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
      address: proposal?.author,
      community: {
        id: activeCommunityId,
        base: user.activeAccount?.community.base,
        ss58Prefix: user.activeAccount?.community.ss58Prefix,
      },
    });
  }, [proposal, activeCommunityId, user.activeAccount?.community]);

  useManageDocumentTitle('View snapshot proposal', proposal?.title);

  const { isWindowLarge } = useBrowserWindow({});

  const loadVotes = useCallback(
    async (proposalId: string) => {
      const currentProposal = (proposalsData || []).find(
        (p) => p.id === proposalId,
      );

      // @ts-expect-error <StrictNullChecks/>
      setProposal(currentProposal);

      setSpace(spaceData!);

      // @ts-expect-error <StrictNullChecks/>
      const results = await getResults(spaceData, currentProposal);
      setVoteResults(results);

      const powerRes = await getPower(
        spaceData!,
        currentProposal!,
        activeUserAddress,
      );

      setPower(powerRes);
    },
    [activeUserAddress, proposalsData, spaceData],
  );

  useNecessaryEffect(() => {
    if (!proposalsData || !spaceData) {
      return;
    }

    loadVotes(identifier).catch(console.error);
  }, [proposalsData, spaceData, identifier, loadVotes]);

  if (!proposal || !space) {
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
        body={() => <MarkdownViewerWithFallback markdown={proposal.body} />}
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
              <SnapshotInformationCard
                proposal={proposal}
                threads={threads}
                spaceId={space?.id}
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
                proposal={proposal}
                scores={[]} // unused?
                space={space}
                symbol={symbol}
                totals={totals}
                totalScore={totalScore}
                validatedAgainstStrategies={validatedAgainstStrategies}
                votes={votes}
                loadVotes={async () => loadVotes(identifier)}
              />
            ),
          },
        ]}
      />
    </CWPageLayout>
  );
};

export default ViewSnapshotProposal;
