import { commonProtocol } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';

interface BuyTokenProps {
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
  const launchPad = new LaunchpadBondingCurve(
    commonProtocol.factoryContracts[ethChainId].lpBondingCurve,
    commonProtocol.factoryContracts[ethChainId].launchpad,
    tokenAddress,
    commonProtocol.factoryContracts[ethChainId].tokenCommunityManager,
    chainRpc,
  );

  return await launchPad.buyToken(amountEth, walletAddress);
};

const useBuyTokenMutation = () => {
  return useMutation({
    mutationFn: buyToken,
  });
};

export default useBuyTokenMutation;
