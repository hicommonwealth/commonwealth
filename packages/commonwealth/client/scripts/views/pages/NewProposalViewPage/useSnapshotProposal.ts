import { notifyError } from 'controllers/app/notifications';
import {
  Power,
  SnapshotProposal,
  SnapshotSpace,
  VoteResults,
  VoteResultsData,
  getPower,
  getResults,
} from 'helpers/snapshot_utils';
import AddressInfo from 'models/AddressInfo';
import { LinkSource } from 'models/Thread';
import { useCallback, useEffect, useMemo, useState } from 'react';
import app from 'state';
import {
  useGetSnapshotProposalsQuery,
  useGetSnapshotSpaceQuery,
} from 'state/api/snapshots';
import { useGetThreadsByLinkQuery } from 'state/api/threads';
import useUserStore from 'state/ui/user';

interface UseSnapshotProposalProps {
  identifier: string;
  snapshotId: string;
}

export const useSnapshotProposal = ({
  identifier,
  snapshotId,
}: UseSnapshotProposalProps) => {
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [power, setPower] = useState<Power | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = useUserStore();
  const { data: spaceData, isLoading: isSpaceLoading } =
    useGetSnapshotSpaceQuery({
      space: snapshotId,
    });

  const { data: proposalsData, isLoading: isProposalsLoading } =
    useGetSnapshotProposalsQuery({
      space: snapshotId,
    });

  const {
    data: threadsData,
    error: threadsError,
    isLoading: isThreadsLoading,
  } = useGetThreadsByLinkQuery({
    communityId: app.activeChainId() || '',
    link: {
      source: LinkSource.Snapshot,
      identifier: proposal?.id || '',
    },
    enabled: !!(app.activeChainId() && proposal?.id),
  });
  const threads = threadsData || [];

  // Detect and notify errors
  useEffect(() => {
    if (!isThreadsLoading && threadsError) {
      notifyError('Could not get threads');
    }
  }, [threadsError, isThreadsLoading]);

  // Compute derived state
  const symbol = space?.symbol || '';
  const validatedAgainstStrategies = !power ? true : power.totalScore > 0;
  const totalScore = power?.totalScore || 0;
  const votes = voteResults?.votes || [];
  const totals: VoteResultsData = voteResults?.results || {
    resultsByVoteBalance: [],
    resultsByStrategyScore: [],
    sumOfResultsBalance: 0,
  };

  const activeUserAddress =
    user.activeAccount?.address || user.addresses?.[0]?.address;
  const activeCommunityId = app.activeChainId();

  // Create proposal author object
  const proposalAuthor = useMemo(() => {
    if (!proposal || !activeCommunityId) {
      return null;
    }
    return new AddressInfo({
      userId: 0,
      id: 0,
      address: proposal?.author,
      community: {
        id: activeCommunityId,
        base: user.activeAccount?.community.base,
        ss58Prefix: user.activeAccount?.community.ss58Prefix,
      },
    });
  }, [proposal, activeCommunityId, user.activeAccount?.community]);

  // Load votes data
  const loadVotes = useCallback(
    async (proposalId) => {
      setIsLoading(true);
      try {
        if (!proposalsData || !spaceData) {
          return;
        }

        const currentProposal = (proposalsData || []).find(
          (p) => p.id === proposalId,
        );

        if (!currentProposal) {
          return;
        }

        setProposal(currentProposal);
        setSpace(spaceData);

        const results = await getResults(spaceData, currentProposal);
        setVoteResults(results);

        if (activeUserAddress) {
          const powerRes = await getPower(
            spaceData,
            currentProposal,
            activeUserAddress,
          );
          setPower(powerRes);
        }
      } catch (error) {
        console.error('Error loading votes:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [activeUserAddress, proposalsData, spaceData],
  );

  // Initial load
  useEffect(() => {
    if (!proposalsData || !spaceData) {
      return;
    }

    loadVotes(identifier).catch(console.error);
  }, [proposalsData, spaceData, identifier, loadVotes]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isSpaceLoading || isProposalsLoading || isThreadsLoading);
  }, [isSpaceLoading, isProposalsLoading, isThreadsLoading]);

  // Return all necessary data and functions
  return {
    proposal,
    space,
    voteResults,
    power,
    isLoading,
    threads,
    symbol,
    validatedAgainstStrategies,
    totalScore,
    votes,
    totals,
    proposalAuthor,
    activeUserAddress,
    loadVotes: () => loadVotes(identifier),
  };
};
