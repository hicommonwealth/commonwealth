import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { getMagicForChain } from 'utils/magicNetworkUtils';
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
    const magic = getMagicForChain(ethChainId);
    if (magic) {
      magicProvider = magic.rpcProvider;
    } else {
      // Handle error appropriately - maybe throw or notify
      throw new Error('Could not initialize Magic for transaction.');
    }
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
