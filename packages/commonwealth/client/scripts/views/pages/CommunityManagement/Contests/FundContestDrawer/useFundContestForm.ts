import { useState } from 'react';

import {
  useFetchTokenUsdRateQuery,
  useGetUserEthBalanceQuery,
} from 'state/api/communityStake';
import { useGetContestBalanceQuery } from 'state/api/contests';
import { useTokenMetadataQuery } from 'state/api/tokens';
import useTokenBalanceQuery from 'state/api/tokens/getTokenBalance';
import { convertTokenAmountToUsd } from 'views/modals/ManageCommunityStakeModal/utils';
import { calculateNewContractBalance, getAmountError } from './utils';

export const INITIAL_AMOUNT = '0.0001';

interface UseFundContestFormProps {
  contestAddress: string;
  chainRpc: string;
  chainNodeId: number;
  ethChainId: number;
  userAddress: string;
  fundingTokenAddress?: string;
}

const useFundContestForm = ({
  contestAddress,
  chainRpc,
  chainNodeId,
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

  const { data: tokenBalances } = useTokenBalanceQuery({
    chainId: chainNodeId,
    tokenId: userAddress,
  });

  const userTokenBalance = fundingTokenAddress
    ? tokenBalances?.tokenBalances?.find(
        (token) => token.contractAddress === fundingTokenAddress,
      )?.tokenBalance
    : userEthBalance;

  const { data: contestBalanceData } = useGetContestBalanceQuery({
    contestAddress,
    chainRpc,
    ethChainId,
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
