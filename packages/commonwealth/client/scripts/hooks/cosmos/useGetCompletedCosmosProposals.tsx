import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { IApp } from 'state';

import { ChainBase } from 'common-common/src/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getCompletedProposals } from 'controllers/chain/cosmos/gov/utils';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

type UseStateSetter<T> = Dispatch<SetStateAction<T>>;

interface Response {
  completedCosmosProposals: CosmosProposal[];
}

interface Props {
  app: IApp;
  setIsLoading: UseStateSetter<boolean>;
  isLoading: boolean;
  setIsLoadingMore?: UseStateSetter<boolean>;
  isApiReady?: boolean;
}

export const useGetCompletedCosmosProposals = ({
  app,
  setIsLoading,
  isLoading,
  setIsLoadingMore,
  isApiReady,
}: Props): Response => {
  const [completedCosmosProposals, setCompletedCosmosProposals] = useState<
    CosmosProposal[]
  >([]);
  const hasFetchedDataRef = useRef(false);

  useEffect(() => {
    const cosmos = app.chain as Cosmos;

    const fetchProposals = async () => {
      if (isApiReady && !hasFetchedDataRef.current) {
        hasFetchedDataRef.current = true;
        setIsLoading(true);
        const proposals = await getCompletedProposals(cosmos);
        setIsLoading(false);
        setCompletedCosmosProposals(proposals);
      }
    };

    const getProposals = async () => {
      const storedProposals =
        cosmos.governance.store.getAll() as CosmosProposal[];
      const completedProposals = storedProposals.filter((p) => p.completed);

      if (completedProposals?.length) {
        if (setIsLoadingMore) setIsLoadingMore(true);
        setCompletedCosmosProposals(completedProposals); // show whatever we have stored
        await fetchProposals(); // update if there are more from the API
        if (setIsLoadingMore) setIsLoadingMore(false);
      } else {
        await fetchProposals();
      }
    };

    if (app.chain?.base === ChainBase.CosmosSDK && !isLoading) {
      getProposals();
    }
  }, [isApiReady, app.chain, setIsLoading, setIsLoadingMore]);

  return {
    completedCosmosProposals,
  };
};
