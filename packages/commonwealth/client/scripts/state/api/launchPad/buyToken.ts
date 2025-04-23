import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { resetBalancesCache } from './helpers/resetBalancesCache';

export interface BuyTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountEth: number;
  walletAddress: string;
  tokenUrl?: string;
}

const buyToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountEth,
  walletAddress,
  tokenUrl,
}: BuyTokenProps) => {
  const launchPad = new LaunchpadBondingCurve(
    commonProtocol.factoryContracts[ethChainId].lpBondingCurve,
    commonProtocol.factoryContracts[ethChainId].launchpad,
    tokenAddress,
    commonProtocol.factoryContracts[ethChainId].tokenCommunityManager,
    chainRpc,
  );

  return await launchPad.buyToken(
    amountEth,
    walletAddress,
    `${ethChainId}`,
    tokenUrl,
  );
};

const useBuyTokenMutation = () => {
  return useMutation({
    mutationFn: buyToken,
    onSuccess: async (_, variables) => {
      await resetBalancesCache(_, variables);
    },
  });
};

export default useBuyTokenMutation;
