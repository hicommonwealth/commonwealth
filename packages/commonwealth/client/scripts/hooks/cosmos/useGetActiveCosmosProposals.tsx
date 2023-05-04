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
}

export const useGetActiveCosmosProposals = ({
  app,
  setIsLoading,
  isLoading,
}: Props): Response => {
  const [activeCosmosProposals, setActiveCosmosProposals] = useState<
    CosmosProposal[]
  >([]);

  const hasFetchedDataRef = useRef(false);

  useEffect(() => {
    const cosmos = app.chain as Cosmos;

    const getAndSetProposals = async () => {
      const proposals = await getActiveProposals(cosmos);
      setActiveCosmosProposals(proposals);
    };

    const getProposals = async () => {
      if (!hasFetchedDataRef.current) {
        hasFetchedDataRef.current = true;
        const storedProposals =
          cosmos.governance.store.getAll() as CosmosProposal[];
        const activeProposals = storedProposals.filter((p) => !p.completed);

        if (activeProposals?.length) {
          setActiveCosmosProposals(activeProposals); // show whatever we have stored
          await getAndSetProposals(); // update if there are more from the API
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
    activeCosmosProposals,
  };
};
