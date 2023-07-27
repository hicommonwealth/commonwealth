import { Dispatch, SetStateAction } from 'react';

import { ApiReadyProps } from 'controllers/chain/cosmos/gov/queries/types';
import {
  useDepositParamsQuery,
  useTallyThresholdsQuery,
  useVotingPeriodQuery,
} from 'controllers/chain/cosmos/gov/queries';

type UseStateSetter<T> = Dispatch<SetStateAction<T>>;

interface Response {
  //   depositParams: DepositParams; // TODO: don't need these because controller sets theM?
  //   tallyParams: TallyParams;
  //   votingParams: VotingParams;
  isLoadingDepositParams: boolean;
}

interface Props extends ApiReadyProps {
  setIsLoading?: UseStateSetter<boolean>;
}

export const useCosmosGovParams = ({
  setIsLoading,
  isApiReady,
}: Props): Response => {
  const { data: depositParams, isLoading: isLoadingDepositParams } =
    useDepositParamsQuery({
      isApiReady,
    });

  const { data: votingParams, isLoading: isLoadingVotingParams } =
    useVotingPeriodQuery({
      isApiReady,
    });

  const { data: tallyParams, isLoading: isLoadingTallyParams } =
    useTallyThresholdsQuery({
      isApiReady,
    });

  return { isLoadingDepositParams };
};
