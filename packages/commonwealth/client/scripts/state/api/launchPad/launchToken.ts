import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';
import { userStore } from 'state/ui/user';
import { getMagicForChain } from 'utils/magicNetworkUtils';
import { fetchNodes } from '../nodes';

interface LaunchTokenProps {
  chainRpc: string;
  ethChainId: number;
  name: string;
  symbol: string;
  walletAddress: string;
}

const launchToken = async ({
  ethChainId,
  chainRpc,
  name,
  symbol,
  walletAddress,
}: LaunchTokenProps) => {
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
    getFactoryContract(ethChainId).LPBondingCurve,
    getFactoryContract(ethChainId).Launchpad,
    '',
    getFactoryContract(ethChainId).TokenCommunityManager,
    chainRpc,
  );

  return await launchPad.launchToken(
    name,
    symbol,
    walletAddress,
    `${ethChainId}`,
    magicProvider,
  );
};

const useLaunchTokenMutation = () => {
  return useMutation({
    mutationFn: launchToken,
  });
};

export default useLaunchTokenMutation;
