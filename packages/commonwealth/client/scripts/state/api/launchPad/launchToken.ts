import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';

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
  );
};

const useLaunchTokenMutation = () => {
  return useMutation({
    mutationFn: launchToken,
  });
};

export default useLaunchTokenMutation;
