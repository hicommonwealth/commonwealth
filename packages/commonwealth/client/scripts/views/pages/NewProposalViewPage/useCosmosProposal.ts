import { CosmosProposalV1AtomOne } from 'client/scripts/controllers/chain/cosmos/gov/atomone/proposal-v1';
import { CosmosProposalGovgen } from 'client/scripts/controllers/chain/cosmos/gov/govgen/proposal-v1beta1';
import { CosmosProposalV1 } from 'client/scripts/controllers/chain/cosmos/gov/v1/proposal-v1';
import { CosmosProposal } from 'client/scripts/controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { LinkSource } from 'client/scripts/models/Thread';
import { useGetThreadsByLinkQuery } from 'client/scripts/state/api/threads';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import app from 'state';
import { usePoolParamsQuery } from 'state/api/chainParams';
import {
  useCosmosProposalDepositsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposalQuery,
  useCosmosProposalTallyQuery,
  useCosmosProposalVotesQuery,
} from 'state/api/proposals';
import type { AnyProposal } from '../../../models/types';

interface UseCosmosProposalProps {
  proposalId: string;
  enabled?: boolean;
}

interface ProposalMetadata {
  title?: string;
  description?: string;
  summary?: string;
}

export const useCosmosProposal = ({
  proposalId,
  enabled = true,
}: UseCosmosProposalProps) => {
  const [proposal, setProposal] = useState<
    | AnyProposal
    | undefined
    | CosmosProposal
    | CosmosProposalV1
    | CosmosProposalGovgen
    | CosmosProposalV1AtomOne
  >(undefined);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isAdapterLoaded, setIsAdapterLoaded] = useState(!!app.chain?.loaded);

  const {
    data: cosmosProposal,
    error: cosmosError,
    isFetching: isFetchingCosmos,
  } = useCosmosProposalQuery({
    isApiReady: !!(app.chain?.apiInitialized && enabled),
    proposalId,
  });

  const { data: metadata, isFetching: isFetchingMetadata } =
    // @ts-expect-error <StrictNullChecks/>
    useCosmosProposalMetadataQuery(proposal || null);

  const { data: threadsData } = useGetThreadsByLinkQuery({
    communityId: app.activeChainId() || '',
    link: {
      source: LinkSource.Proposal,
      identifier: proposalId,
    },
    enabled: !!(app.activeChainId() && proposalId),
  });
  const threads = threadsData || [];
  const { data: poolData } = usePoolParamsQuery();
  const poolValue = poolData ? +poolData : undefined;

  const { data: votes } = useCosmosProposalVotesQuery(
    // @ts-expect-error <StrictNullChecks/>

    proposal || null,
    poolValue,
  );
  // @ts-expect-error <StrictNullChecks/>
  const { data: tally } = useCosmosProposalTallyQuery(proposal);

  const { data: deposits } = useCosmosProposalDepositsQuery(
    // @ts-expect-error <StrictNullChecks/>
    proposal || null,
    poolValue,
  );

  useEffect(() => {
    if (cosmosProposal) {
      setProposal(cosmosProposal);
      setTitle(cosmosProposal.title || '');
      setDescription(cosmosProposal.description || '');
    }
  }, [cosmosProposal]);

  useEffect(() => {
    if (!_.isEmpty(metadata)) {
      const typedMetadata = metadata as ProposalMetadata;
      if (typedMetadata.title) {
        setTitle(typedMetadata.title);
      }
      setDescription(typedMetadata.description || typedMetadata.summary || '');
    }
  }, [metadata]);

  useEffect(() => {
    if (!isAdapterLoaded) {
      const handleAdapterReady = () => setIsAdapterLoaded(true);
      app.chainAdapterReady.on('ready', handleAdapterReady);

      return () => {
        app.chainAdapterReady.off('ready', handleAdapterReady);
      };
    }
  }, [isAdapterLoaded]);

  return {
    proposal,
    title,
    description,
    isLoading: isFetchingCosmos || !isAdapterLoaded,
    isFetchingMetadata,
    error: cosmosError,
    metadata,
    votes,
    tally,
    deposits,
    threads,
  };
};
