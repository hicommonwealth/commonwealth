import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { IApp } from 'state';

import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
} from 'state/api/proposals';

type UseStateSetter<T> = Dispatch<SetStateAction<T>>;

interface Response {
  activeCosmosProposals: CosmosProposal[];
  completedCosmosProposals: CosmosProposal[];
}

interface Props {
  app: IApp;
  setIsLoadingActiveProposals?: UseStateSetter<boolean>;
  setIsLoadingCompletedProposals?: UseStateSetter<boolean>;
  needToInitAPI?: boolean;
}

export const useGetAllCosmosProposals = ({
  app,
  setIsLoadingActiveProposals,
  setIsLoadingCompletedProposals,
  needToInitAPI,
}: Props): Response => {
  const startedApiRef = useRef(false);
  const [isApiReady, setIsApiReady] = useState(!needToInitAPI);

  const { data: activeCosmosProposals, isLoading: isLoadingActiveProps } =
    useActiveCosmosProposalsQuery({
      isApiReady,
    });

  const { data: completedCosmosProposals, isLoading: isLoadingCompletedProps } =
    useCompletedCosmosProposalsQuery({
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

  useEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    setIsLoadingActiveProposals(isLoadingActiveProps);
    if (!isApiReady && activeCosmosProposals?.length === 0) {
      // @ts-expect-error <StrictNullChecks/>
      setIsLoadingActiveProposals(true);
    }
  }, [
    isLoadingActiveProps,
    isApiReady,
    activeCosmosProposals?.length,
    setIsLoadingActiveProposals,
  ]);

  useEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    setIsLoadingCompletedProposals(isLoadingCompletedProps);
    if (!isApiReady && completedCosmosProposals?.length === 0) {
      // @ts-expect-error <StrictNullChecks/>
      setIsLoadingCompletedProposals(true);
    }
  }, [
    isLoadingCompletedProps,
    isApiReady,
    completedCosmosProposals?.length,
    setIsLoadingCompletedProposals,
  ]);

  return {
    // @ts-expect-error <StrictNullChecks/>
    activeCosmosProposals,
    // @ts-expect-error <StrictNullChecks/>
    completedCosmosProposals,
  };
};
