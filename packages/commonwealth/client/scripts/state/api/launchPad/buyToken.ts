import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import MagicWebWalletController from 'controllers/app/webWallets/MagicWebWallet';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { fetchNodes } from '../nodes';
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
    magicProvider = controller.provider as unknown as any;
  }

  const launchPad = new LaunchpadBondingCurve(
    getFactoryContract(ethChainId).LPBondingCurve,
    getFactoryContract(ethChainId).Launchpad,
    tokenAddress,
    getFactoryContract(ethChainId).TokenCommunityManager,
    chainRpc,
  );

  return await launchPad.buyToken(
    amountEth,
    walletAddress,
    `${ethChainId}`,
    tokenUrl,
    magicProvider,
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
