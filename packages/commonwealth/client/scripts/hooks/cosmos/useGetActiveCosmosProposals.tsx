import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { IApp } from 'state';

import { ChainBase } from 'common-common/src/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getActiveProposals } from 'controllers/chain/cosmos/gov/utils';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

type UseStateSetter<T> = Dispatch<SetStateAction<T>>;

interface Response {
  activeCosmosProposals: CosmosProposal[];
}

interface Props {
  app: IApp;
  setIsLoading: UseStateSetter<boolean>;
  isLoading: boolean;
  isApiReady?: boolean;
}

export const useGetActiveCosmosProposals = ({
  app,
  setIsLoading,
  isLoading,
  isApiReady,
}: Props): Response => {
  const [activeCosmosProposals, setActiveCosmosProposals] = useState<
    CosmosProposal[]
  >([]);

  const hasFetchedDataRef = useRef(false);

  useEffect(() => {
    const cosmos = app.chain as Cosmos;

    const fetchProposals = async () => {
      if (isApiReady && !hasFetchedDataRef.current) {
        hasFetchedDataRef.current = true;
        const proposals = await getActiveProposals(cosmos);
        setActiveCosmosProposals(proposals);
      }
    };

    const getProposals = async () => {
      const storedProposals =
        cosmos.governance.store.getAll() as CosmosProposal[];
      const activeProposals = storedProposals.filter((p) => !p.completed);

      if (activeProposals?.length) {
        setActiveCosmosProposals(activeProposals); // show whatever we have stored
        await fetchProposals(); // update if there are more from the API
      } else {
        setIsLoading(true);
        await fetchProposals();
        setIsLoading(false);
      }
    };

    if (app.chain?.base === ChainBase.CosmosSDK && !isLoading) {
      getProposals();
    }
  }, [isApiReady, app.chain, isLoading, setIsLoading]);

  return {
    activeCosmosProposals,
  };
};
