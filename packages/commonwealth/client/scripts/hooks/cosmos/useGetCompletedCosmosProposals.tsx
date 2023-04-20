import { IApp } from 'state';
import { useEffect, useState } from 'react';
import _ from 'lodash';

import { ChainBase } from 'common-common/src/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getCompletedProposals } from 'controllers/chain/cosmos/gov/utils';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

interface Response {
  completedCosmosProposals: CosmosProposal[];
  isLoading: boolean;
}

interface Props {
  app: IApp;
}

export const useGetCompletedCosmosProposals = ({ app }: Props): Response => {
  const [isLoading, setLoading] = useState(false);
  const [completedCosmosProposals, setCompletedCosmosProposals] = useState<
    CosmosProposal[]
  >([]);

  useEffect(() => {
    const getProposals = async () => {
      const cosmos = app.chain as Cosmos;
      const storedProposals =
        cosmos.governance.store.getAll() as CosmosProposal[];
      const completedProposals = storedProposals.filter((p) => p.completed);
      const deduped = _.uniqBy(completedProposals, 'identifier'); // not sure why store has duplicates

      if (completedProposals?.length) {
        setCompletedCosmosProposals(deduped);
      } else {
        setLoading(true);
        const proposals = await getCompletedProposals(cosmos);
        setCompletedCosmosProposals(proposals);
        setLoading(false);
      }
    };

    if (
      app.chain?.apiInitialized &&
      app.chain?.base === ChainBase.CosmosSDK &&
      !isLoading
    ) {
      getProposals();
    }
  }, [app.chain?.apiInitialized]);

  return {
    completedCosmosProposals,
    isLoading,
  };
};
