import { commonProtocol } from '@hicommonwealth/evm-protocols';
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
    commonProtocol.factoryContracts[ethChainId].lpBondingCurve,
    commonProtocol.factoryContracts[ethChainId].launchpad,
    tokenAddress,
    commonProtocol.factoryContracts[ethChainId].tokenCommunityManager,
    chainRpc,
  );

  return await launchPad.getAmountOut(
    tokenAmount,
    mode === 'sell' ? false : true,
    `${ethChainId}`,
  );
};

const useTokenEthExchangeRateQuery = ({
  ethChainId,
  chainRpc,
  tokenAddress,
  tokenAmount,
  mode,
  enabled = true,
}: TokenEthExchangeRateProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: [ethChainId, chainRpc, tokenAddress, tokenAmount, mode],
    queryFn: () =>
      tokenEthExchangeRate({
        ethChainId,
        chainRpc,
        tokenAddress,
        tokenAmount,
        mode,
      }),
    staleTime: TOKEN_ETH_EXCHANGE_TIME,
    cacheTime: TOKEN_ETH_EXCHANGE_TIME,
    enabled,
  });
};

export default useTokenEthExchangeRateQuery;
