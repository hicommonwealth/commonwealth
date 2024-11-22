import { commonProtocol } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { trpc } from 'utils/trpcClient';
import { resetBalancesCache } from './helpers/resetBalancesCache';

interface SellTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountToken: number;
  walletAddress: string;
}

const sellToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountToken,
  walletAddress,
}: SellTokenProps) => {
  const launchPad = new LaunchpadBondingCurve(
    commonProtocol.factoryContracts[ethChainId].lpBondingCurve,
    commonProtocol.factoryContracts[ethChainId].launchpad,
    tokenAddress,
    commonProtocol.factoryContracts[ethChainId].tokenCommunityManager,
    chainRpc,
  );

  return await launchPad.sellToken(amountToken, walletAddress, `${ethChainId}`);
};

const useSellTokenMutation = () => {
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: sellToken,
    onSuccess: async (_, variables) => {
      await resetBalancesCache(_, variables, utils);
    },
  });
};

export default useSellTokenMutation;
