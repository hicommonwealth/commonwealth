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
}

export const useGetCompletedCosmosProposals = ({
  app,
  setIsLoading,
  isLoading,
  setIsLoadingMore,
}: Props): Response => {
  const [completedCosmosProposals, setCompletedCosmosProposals] = useState<
    CosmosProposal[]
  >([]);

  const hasFetchedDataRef = useRef(false);

  useEffect(() => {
    const cosmos = app.chain as Cosmos;

    const getAndSetProposals = async () => {
      const proposals = await getCompletedProposals(cosmos);
      setCompletedCosmosProposals(proposals);
    };

    const getProposals = async () => {
      if (!hasFetchedDataRef.current) {
        hasFetchedDataRef.current = true;
        const storedProposals =
          cosmos.governance.store.getAll() as CosmosProposal[];
        const completedProposals = storedProposals.filter((p) => p.completed);

        if (completedProposals?.length) {
          if (setIsLoadingMore) setIsLoadingMore(true);
          setCompletedCosmosProposals(completedProposals); // show whatever we have stored
          await getAndSetProposals(); // update if there are more from the API
          if (setIsLoadingMore) setIsLoadingMore(false);
        } else {
          setIsLoading(true);
          await getAndSetProposals();
          setIsLoading(false);
        }
      }
    };

    const initApiThenFetch = async () => {
      await app.chain.initApi();
      await getProposals();
    };

    if (app.chain?.base === ChainBase.CosmosSDK && !isLoading) {
      if (app.chain?.apiInitialized) {
        getProposals();
      } else {
        initApiThenFetch();
      }
    }
  }, [app.chain?.apiInitialized]);

  return {
    completedCosmosProposals,
  };
};
