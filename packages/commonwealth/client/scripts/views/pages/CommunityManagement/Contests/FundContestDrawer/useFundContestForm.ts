import { useState } from 'react';

import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import { useGetContestBalanceQuery } from 'state/api/contests';
import {
  useGetERC20BalanceQuery,
  useTokenMetadataQuery,
} from 'state/api/tokens';
import { convertTokenAmountToUsd } from 'views/modals/ManageCommunityStakeModal/utils';
import { calculateNewContractBalance, getAmountError } from './utils';

export const INITIAL_AMOUNT = '0.001';

interface UseFundContestFormProps {
  contestAddress: string;
  chainRpc: string;
  ethChainId: number;
  userAddress: string;
  fundingTokenAddress?: string;
}

const useFundContestForm = ({
  contestAddress,
  chainRpc,
  ethChainId,
  userAddress,
  fundingTokenAddress,
}: UseFundContestFormProps) => {
  const [tokenAmount, setTokenAmount] = useState(INITIAL_AMOUNT);
  const { data: tokenMetadata } = useTokenMetadataQuery({
    nodeEthChainId: ethChainId,
    tokenId: fundingTokenAddress || '',
  });
  const { data: tokenUsdRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: tokenMetadata?.symbol || 'ETH',
    enabled: fundingTokenAddress ? !!tokenMetadata : true,
  });
  const tokenUsdRate = tokenUsdRateData?.data?.data?.amount;
  // @ts-expect-error StrictNullChecks
  const tokenAmountInUsd = convertTokenAmountToUsd(tokenAmount, tokenUsdRate);

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: userAddress,
    apiEnabled: !!userAddress && !fundingTokenAddress,
    ethChainId,
  });

  const { data: tokenBalance } = useGetERC20BalanceQuery({
    tokenAddress: fundingTokenAddress || '',
    userAddress,
    nodeRpc: chainRpc,
  });

  const userTokenBalance = fundingTokenAddress ? tokenBalance : userEthBalance;

  const { data: contestBalanceData } = useGetContestBalanceQuery({
    contestAddress,
    chainRpc,
    ethChainId,
    isOneOff: !!fundingTokenAddress,
  });

  const contestTokenBalance =
    tokenMetadata?.decimals && contestBalanceData
      ? String(contestBalanceData / Math.pow(10, tokenMetadata?.decimals))
      : String(contestBalanceData);

  const newContestTokenBalance = calculateNewContractBalance(
    contestTokenBalance,
    tokenAmount,
  );

  const newContestBalanceInUsd = convertTokenAmountToUsd(
    newContestTokenBalance,
    // @ts-expect-error StrictNullChecks
    tokenUsdRate,
  );

  // @ts-expect-error StrictNullChecks
  const amountError = getAmountError(userTokenBalance, tokenAmount);

  return {
    tokenAmount,
    tokenAmountInUsd,
    setTokenAmount,
    amountError,
    contestTokenBalance,
    newContestBalanceInUsd,
    newContestTokenBalance,
    userTokenBalance,
  };
};

export default useFundContestForm;
