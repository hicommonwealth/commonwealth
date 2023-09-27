import { ChainNetwork } from 'common-common/src/types';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import useForceRerender from '../../../hooks/useForceRerender';
import { useInitChainIfNeeded } from '../../../hooks/useInitChainIfNeeded';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import useNecessaryEffect from '../../../hooks/useNecessaryEffect';
import { chainToProposalSlug, idToProposal } from '../../../identifiers';
import { AnyProposal } from '../../../models/types';
import { usePoolParamsQuery } from '../../../state/api/chainParams/index';
import {
  useAaveProposalsQuery,
  useCosmosProposalDepositsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposalQuery,
  useCosmosProposalTallyQuery,
  useCosmosProposalVotesQuery,
} from '../../../state/api/proposals/index';
import app from '../../../state/index';

export const useProposalData = (
  proposalId: string,
  typeProp?: string,
  ignoreInitChain = false
) => {
  const forceRerender = useForceRerender();
  useInitChainIfNeeded(app, ignoreInitChain);
  const [isAdapterLoaded, setIsAdapterLoaded] = useState(!!app.chain?.loaded);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState<AnyProposal>(undefined);
  const { data: cosmosProposal } = useCosmosProposalQuery({
    isApiReady: !!app.chain.apiInitialized,
    proposalId,
  });
  const [title, setTitle] = useState<string>(proposal?.title);
  const [description, setDescription] = useState<string>(proposal?.description);
  const { data: metadata, isFetching: isFetchingMetadata } =
    useCosmosProposalMetadataQuery(proposal);
  const { data: poolData } = usePoolParamsQuery();
  useCosmosProposalVotesQuery(proposal, +poolData);
  useCosmosProposalTallyQuery(proposal);
  useCosmosProposalDepositsQuery(proposal, +poolData);

  useEffect(() => {
    setProposal(cosmosProposal);
    setTitle(cosmosProposal?.title);
    setDescription(cosmosProposal?.description);
  }, [cosmosProposal]);

  useEffect(() => {
    if (_.isEmpty(metadata)) return;
    setTitle(metadata?.title);
    setDescription(metadata?.description || metadata?.summary);
  }, [metadata]);

  useEffect(() => {
    proposal?.isFetched.once('redraw', forceRerender);

    return () => {
      proposal?.isFetched.removeAllListeners();
    };
  }, [proposal, forceRerender]);

  useManageDocumentTitle('View proposal', proposal?.title);

  const getProposalFromStore = () => {
    let resolvedType = typeProp;
    if (!typeProp) {
      resolvedType = chainToProposalSlug(app.chain.meta);
    }
    return idToProposal(resolvedType, proposalId);
  };

  const onAave = app.chain?.network === ChainNetwork.Aave;
  const fetchAaveData = onAave && isAdapterLoaded;
  const { data: cachedAaveProposals, isLoading: aaveProposalsLoading } =
    useAaveProposalsQuery({
      moduleReady: fetchAaveData,
      chainId: app.chain?.id,
    });

  useEffect(() => {
    if (!aaveProposalsLoading && fetchAaveData && !proposal) {
      const foundProposal = cachedAaveProposals?.find(
        (p) => p.identifier === proposalId
      );

      if (!foundProposal?.ipfsData) {
        foundProposal?.ipfsDataReady.once('ready', () =>
          setProposal(foundProposal)
        );
      } else {
        setProposal(foundProposal);
      }
    }
  }, [
    aaveProposalsLoading,
    cachedAaveProposals,
    fetchAaveData,
    proposal,
    proposalId,
  ]);

  useNecessaryEffect(() => {
    const afterAdapterLoaded = async () => {
      if (onAave) return;
      try {
        const proposalFromStore = getProposalFromStore();
        setProposal(proposalFromStore);
        setError(null);
      } catch (e) {
        console.log(`#${proposalId} Not found in store. `, e);
      }
    };

    if (!isAdapterLoaded) {
      app.chainAdapterReady.on('ready', () => {
        setIsAdapterLoaded(true);
        afterAdapterLoaded();
      });
    } else {
      afterAdapterLoaded();
    }
  }, [isAdapterLoaded, proposalId]);

  useNecessaryEffect(() => {
    const afterAdapterLoaded = async () => {
      try {
        const proposalFromStore = getProposalFromStore();
        setProposal(proposalFromStore);
        setError(null);
      } catch (e) {
        console.log(`#${proposalId} Not found in store. `, e);
      }
    };

    if (!isAdapterLoaded) {
      app.chainAdapterReady.on('ready', () => {
        setIsAdapterLoaded(true);
        afterAdapterLoaded();
      });
    } else {
      afterAdapterLoaded();
    }
  }, [isAdapterLoaded, proposalId]);

  return {
    error,
    metadata,
    isAdapterLoaded,
    proposal,
    title,
    description,
    isFetchingMetadata,
  };
};
