import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import MagicWebWalletController from 'controllers/app/webWallets/MagicWebWallet';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { fetchNodes } from '../nodes';
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
  // Check if the selected address belongs to a Magic user
  const userAddresses = userStore.getState().addresses;
  const isMagicAddress = userAddresses.some(
    (addr) =>
      addr.address.toLowerCase() === walletAddress.toLowerCase() &&
      addr.walletId?.toLowerCase().includes('magic'),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let magicProvider: any = null;
  if (isMagicAddress) {
    // Ensure nodes are fetched (kept for side effects if needed)
    await fetchNodes();

    const controller = new MagicWebWalletController();
    await controller.enable(`${ethChainId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    magicProvider = controller.provider as unknown as any;
  }

  const launchPad = new LaunchpadBondingCurve(
    getFactoryContract(ethChainId).LPBondingCurve,
    getFactoryContract(ethChainId).Launchpad,
    tokenAddress,
    getFactoryContract(ethChainId).TokenCommunityManager,
    chainRpc,
  );

  return await launchPad.sellToken(
    amountToken,
    walletAddress,
    `${ethChainId}`,
    magicProvider,
  );
};

const useSellTokenMutation = () => {
  return useMutation({
    mutationFn: sellToken,
    onSuccess: async (_, variables) => {
      await resetBalancesCache(_, variables);
    },
  });
};

export default useSellTokenMutation;
