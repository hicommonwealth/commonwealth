import { LPBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useQuery } from '@tanstack/react-query';
import Web3 from 'web3';

const PRICE_STALE_TIME = 5000;

export const useGetLaunchpadPriceQuery = (
  rpc: string,
  ethChainId: number,
  tokenAddress: string,
  enabled = true,
) => {
  const isBuy = true;
  const amountIn = 1;

  const contractAddress = getFactoryContract(ethChainId).LPBondingCurve;
  const web3 = new Web3(rpc);
  const contract = new web3.eth.Contract(LPBondingCurveAbi, contractAddress);

  return useQuery({
    queryKey: ['launchpadPrice', tokenAddress, amountIn, isBuy],
    staleTime: PRICE_STALE_TIME,
    enabled: !!contract && !!tokenAddress && enabled,
    queryFn: async () => {
      const price = contract.methods.getPrice(tokenAddress, amountIn, isBuy);
      return (await price.call()) as bigint;
    },
  });
};
