import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import _ from 'lodash';
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
    const getProposals = async () => {
      if (!hasFetchedDataRef.current) {
        hasFetchedDataRef.current = true;
        const cosmos = app.chain as Cosmos;
        const storedProposals =
          cosmos.governance.store.getAll() as CosmosProposal[];
        const activeProposals = storedProposals.filter((p) => !p.completed);
        if (activeProposals?.length) {
          setActiveCosmosProposals(activeProposals);
        } else {
          setIsLoading(true);
          const proposals = await getActiveProposals(cosmos);
          setActiveCosmosProposals(proposals);
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
