import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { getMagicForChain } from 'utils/magicNetworkUtils';
import { resetBalancesCache } from './helpers/resetBalancesCache';

export interface BuyTokenProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  amountEth: number;
  walletAddress: string;
}

const buyToken = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  amountEth,
  walletAddress,
}: BuyTokenProps) => {
  // Check if the selected address belongs to a Magic user
  const userAddresses = userStore.getState().addresses;
  const isMagicAddress = userAddresses.some(
    (addr) =>
      addr.address.toLowerCase() === walletAddress.toLowerCase() &&
      addr.walletId?.toLowerCase().includes('magic'),
  );

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
