import { useCallback, useEffect, useMemo, useState } from 'react';
import { notifyError } from '../../../controllers/app/notifications';
import {
  getPower,
  getResults,
  Power,
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
  VoteResults,
  VoteResultsData,
} from '../../../helpers/snapshot_utils';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import useNecessaryEffect from '../../../hooks/useNecessaryEffect';
import AddressInfo from '../../../models/AddressInfo';
import { LinkSource } from '../../../models/Thread';
import { useGetThreadsByLinkQuery } from '../../../state/api/threads/index';
import app from '../../../state/index';

export const useSnapshotProposalData = (
  snapshotProposalId: string,
  snapshotId: string
) => {
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
    return new AddressInfo({
      id: null,
      address: snapshotProposal.author,
      chainId: activeChainId,
    });
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
};
