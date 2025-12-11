import { LPBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import { getFactoryContract, ValidChains } from '@hicommonwealth/evm-protocols';
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

  let contract;
  if (
    [ValidChains.Anvil, ValidChains.Base, ValidChains.SepoliaBase].includes(
      ethChainId,
    )
  ) {
    const contractAddress = tokenAddress
      ? getFactoryContract(ethChainId).LPBondingCurve
      : null;
    const web3 = new Web3(rpc);
    contract = contractAddress
      ? new web3.eth.Contract(LPBondingCurveAbi, contractAddress)
      : null;
  }

  return useQuery({
    // contract is derived from ethChainId, rpc, and contractAddress (all in queryKey)
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'launchpadPrice',
      ethChainId,
      rpc,
      tokenAddress,
      amountIn,
      isBuy,
    ],
    staleTime: PRICE_STALE_TIME,
    enabled: !!contract && !!tokenAddress && enabled,
    queryFn: async () => {
      const price =
        contract &&
        contract.methods &&
        contract.methods.getPrice(tokenAddress, amountIn, isBuy);
      return (await price?.call()) as bigint | undefined;
    },
  });
};
