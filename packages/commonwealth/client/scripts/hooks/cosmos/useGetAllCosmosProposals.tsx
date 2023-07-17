import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { IApp } from 'state';

import { ChainBase } from 'common-common/src/types';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { useGetCompletedCosmosProposals } from './useGetCompletedCosmosProposals';
import { useGetActiveCosmosProposals } from './useGetActiveCosmosProposals';

type UseStateSetter<T> = Dispatch<SetStateAction<T>>;

interface Response {
  activeCosmosProposals: CosmosProposal[];
  completedCosmosProposals: CosmosProposal[];
}

interface Props {
  app: IApp;
  setIsLoadingActiveProposals?: UseStateSetter<boolean>;
  setIsLoadingCompletedProposals?: UseStateSetter<boolean>;
  isLoadingActiveProposals?: boolean;
  isLoadingCompletedProposals?: boolean;
  needToInitAPI?: boolean;
}

export const useGetAllCosmosProposals = ({
  app,
  setIsLoadingActiveProposals,
  setIsLoadingCompletedProposals,
  isLoadingActiveProposals,
  isLoadingCompletedProposals,
  needToInitAPI,
}: Props): Response => {
  const startedApiRef = useRef(false);
  const [isApiReady, setIsApiReady] = useState(false);

  const { activeCosmosProposals } = useGetActiveCosmosProposals({
    app,
    setIsLoading: setIsLoadingActiveProposals,
    isApiReady,
  });

  const { completedCosmosProposals } = useGetCompletedCosmosProposals({
    app,
    setIsLoading: setIsLoadingCompletedProposals,
    isApiReady,
  });

  useEffect(() => {
    const initApi = async () => {
      startedApiRef.current = true;
      await app.chain.initApi();
      setIsApiReady(true);
    };

    if (
      app.chain?.base === ChainBase.CosmosSDK &&
      needToInitAPI &&
      !startedApiRef.current
    ) {
      initApi();
    }
  }, [needToInitAPI, app.chain]);

  return {
    activeCosmosProposals,
    completedCosmosProposals,
  };
};
