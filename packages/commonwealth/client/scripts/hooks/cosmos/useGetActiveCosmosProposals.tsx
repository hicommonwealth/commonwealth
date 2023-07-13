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
        setIsLoading(true);
        const proposals = await getActiveProposals(cosmos);
        setIsLoading(false);
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
        await fetchProposals();
      }
    };

    if (app.chain?.base === ChainBase.CosmosSDK && !isLoading) {
      getProposals();
    }
  }, [isApiReady, app.chain, setIsLoading]);

  return {
    activeCosmosProposals,
  };
};
