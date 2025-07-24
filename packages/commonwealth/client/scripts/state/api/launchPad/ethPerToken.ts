import { LPBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import { factoryContracts, getAmountIn } from '@hicommonwealth/evm-protocols';
import { useQuery } from '@tanstack/react-query';
import Web3 from 'web3';

const TOKEN_ETH_EXCHANGE_TIME = 30 * 1000; // 30s

interface EthPerTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
}

const ethPerToken = async ({
  ethChainId,
  tokenAddress,
  chainRpc,
}: EthPerTokenProps) => {
  const contractAddress = factoryContracts[ethChainId].lpBondingCurve;

  const web3 = new Web3(chainRpc);
  const contract = new web3.eth.Contract(LPBondingCurveAbi, contractAddress);

  const amountIn = await getAmountIn(contract, tokenAddress, 1e18, 830000);

  return amountIn / 1e18;
};

export const getEthPerTokenQueryKey = (params: EthPerTokenProps) => [
  'ETH_PER_TOKEN',
  params.ethChainId,
  params.tokenAddress,
  params.chainRpc,
];

const useEthPerTokenQuery = ({
  ethChainId,
  chainRpc,
  tokenAddress,
  enabled = true,
}: EthPerTokenProps & { enabled?: boolean }) => {
  return useQuery({
    queryKey: getEthPerTokenQueryKey({
      ethChainId,
      chainRpc,
      tokenAddress,
    }),
    queryFn: () =>
      ethPerToken({
        ethChainId,
        chainRpc,
        tokenAddress,
      }),
    staleTime: TOKEN_ETH_EXCHANGE_TIME,
    gcTime: TOKEN_ETH_EXCHANGE_TIME,
    enabled,
  });
};

export default useEthPerTokenQuery;
