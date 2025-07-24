import { factoryContracts } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { getMagicForChain } from 'utils/magicNetworkUtils';
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
    const node = await fetchNodes();
    const chainNode = node.find((n) => n.ethChainId === ethChainId);
    const magic = getMagicForChain(ethChainId, chainNode);
    if (magic) {
      magicProvider = magic.rpcProvider;
    } else {
      // Handle error appropriately - maybe throw or notify
      throw new Error('Could not initialize Magic for transaction.');
    }
  }

  const launchPad = new LaunchpadBondingCurve(
    factoryContracts[ethChainId].lpBondingCurve,
    factoryContracts[ethChainId].launchpad,
    tokenAddress,
    factoryContracts[ethChainId].tokenCommunityManager,
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
