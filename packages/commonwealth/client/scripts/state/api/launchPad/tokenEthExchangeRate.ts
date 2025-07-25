import { factoryContracts } from '@hicommonwealth/evm-protocols';
import { useQuery } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';

const TOKEN_ETH_EXCHANGE_TIME = 30 * 1000; // 30s

interface TokenEthExchangeRateProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  tokenAmount: number;
  mode: 'sell' | 'buy';
}

const tokenEthExchangeRate = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  tokenAmount,
  mode,
}: TokenEthExchangeRateProps) => {
  const launchPad = new LaunchpadBondingCurve(
    factoryContracts[ethChainId].lpBondingCurve,
    factoryContracts[ethChainId].launchpad,
    tokenAddress,
    factoryContracts[ethChainId].tokenCommunityManager,
    chainRpc,
  );

  return await launchPad.getAmountOut(
    tokenAmount,
    mode === 'sell' ? false : true,
    `${ethChainId}`,
  );
};

export const getTokenEthExchangeRateQueryKey = (
  params: TokenEthExchangeRateProps,
) => [
  'TOKEN_ETH_EXCHANGE_RATE',
  params.ethChainId,
  params.chainRpc,
  params.tokenAddress,
  params.tokenAmount,
  params.mode,
];

const useTokenEthExchangeRateQuery = ({
  ethChainId,
  chainRpc,
  tokenAddress,
  tokenAmount,
  mode,
  enabled = true,
}: TokenEthExchangeRateProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: getTokenEthExchangeRateQueryKey({
      chainRpc,
      ethChainId,
      mode,
      tokenAddress,
      tokenAmount,
    }),
    queryFn: () =>
      tokenEthExchangeRate({
        ethChainId,
        chainRpc,
        tokenAddress,
        tokenAmount,
        mode,
      }),
    staleTime: TOKEN_ETH_EXCHANGE_TIME,
    gcTime: TOKEN_ETH_EXCHANGE_TIME,
    enabled,
  });
};

export default useTokenEthExchangeRateQuery;
