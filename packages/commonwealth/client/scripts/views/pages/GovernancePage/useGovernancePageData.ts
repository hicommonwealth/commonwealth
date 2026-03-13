import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposal } from 'client/scripts/controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { useFlag } from 'client/scripts/hooks/useFlag';
import { useInitChainIfNeeded } from 'features/governance/hooks/useInitChainIfNeeded';
import { useEffect, useMemo, useState } from 'react';
import app from 'state';
import {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
} from 'state/api/proposals';

type GovernancePageStatus = 'loading' | 'network-error' | 'not-found' | 'ready';

export const useGovernancePageData = () => {
  const governancePageEnabled = useFlag('governancePage');
  const [isChainLoading, setIsChainLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized,
  );

  useInitChainIfNeeded(app);

  useEffect(() => {
    const handleChainReady = () => {
      setIsChainLoading(false);
    };

    app.chainAdapterReady.on('ready', handleChainReady);

    return () => {
      app.chainAdapterReady.off('ready', handleChainReady);
    };
  }, []);

  const onCosmos = app.chain?.base === ChainBase.CosmosSDK;
  const {
    data: activeCosmosProposals,
    isLoading: isLoadingActiveCosmosProposals,
  } = useActiveCosmosProposalsQuery({
    isApiReady: !!app.chain?.apiInitialized,
  });
  const {
    data: completedCosmosProposals,
    isLoading: isLoadingCompletedCosmosProposals,
  } = useCompletedCosmosProposalsQuery({
    isApiReady: !!app.chain?.apiInitialized,
  });

  const isProposalLoading =
    onCosmos &&
    (isLoadingActiveCosmosProposals || isLoadingCompletedCosmosProposals);

  const status = useMemo<GovernancePageStatus>(() => {
    if (isChainLoading) {
      return app.chain?.failed ? 'network-error' : 'loading';
    }

    if (isProposalLoading) {
      return 'loading';
    }

    if (!governancePageEnabled) {
      return 'not-found';
    }

    return 'ready';
  }, [governancePageEnabled, isChainLoading, isProposalLoading]);

  const totalProposalsCount = useMemo(() => {
    const activeProposalsCount = activeCosmosProposals?.length || 0;
    const inactiveProposalsCount =
      onCosmos && completedCosmosProposals
        ? completedCosmosProposals.length
        : 0;

    return activeProposalsCount + inactiveProposalsCount;
  }, [activeCosmosProposals?.length, completedCosmosProposals, onCosmos]);

  const chain: ChainBase.CosmosSDK | ChainBase.Ethereum = onCosmos
    ? ChainBase.CosmosSDK
    : ChainBase.Ethereum;

  return {
    activeCosmosProposals: activeCosmosProposals as
      | CosmosProposal[]
      | undefined,
    chain,
    completedCosmosProposals: completedCosmosProposals as
      | CosmosProposal[]
      | undefined,
    status,
    totalProposalsCount,
  };
};
