import { useState } from 'react';

import {
  useFetchEthUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import { useGetContestBalanceQuery } from 'state/api/contests';
import { convertEthToUsd } from 'views/modals/ManageCommunityStakeModal/utils';

import { calculateNewContractBalance, getAmountError } from './utils';

export const INITIAL_AMOUNT = '0.0001';

interface UseFundContestFormProps {
  contestAddress: string;
  chainRpc: string;
  ethChainId: number;
  userAddress: string;
}

const useFundContestForm = ({
  contestAddress,
  chainRpc,
  ethChainId,
  userAddress,
}: UseFundContestFormProps) => {
  const [amountEth, setAmountEth] = useState(INITIAL_AMOUNT);
  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;
  const amountEthInUsd = convertEthToUsd(amountEth, ethUsdRate);

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: userAddress,
    apiEnabled: !!userAddress,
    ethChainId,
  });

  const { data: contestBalanceData } = useGetContestBalanceQuery({
    contestAddress,
    chainRpc,
    ethChainId,
  });

  const contestEthBalance = String(contestBalanceData);

  const newContestBalanceInEth = calculateNewContractBalance(
    contestEthBalance,
    amountEth,
  );

  const newContestBalanceInUsd = convertEthToUsd(
    newContestBalanceInEth,
    ethUsdRate,
  );

  const amountError = getAmountError(userEthBalance, amountEth);

  return {
    amountEth,
    amountEthInUsd,
    setAmountEth,
    amountError,
    contestEthBalance,
    newContestBalanceInUsd,
    newContestBalanceInEth,
    userEthBalance,
  };
};

export default useFundContestForm;
