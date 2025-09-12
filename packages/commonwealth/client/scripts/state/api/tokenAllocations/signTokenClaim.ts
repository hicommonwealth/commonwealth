import { useMutation } from '@tanstack/react-query';
import SignTokenClaim from 'helpers/ContractHelpers/signTokenClaim';

interface SignTokenClaimProps {
  chainRpc: string;
  ethChainId: number;
  tokenAddress: string;
  walletAddress: string;
  data: string;
}

const signTokenClaim = async ({
  ethChainId,
  chainRpc,
  tokenAddress,
  walletAddress,
  data,
}: SignTokenClaimProps) => {
  const stc = new SignTokenClaim(tokenAddress, chainRpc);
  return await stc.sign(walletAddress, `${ethChainId}`, data);
};

const useSignTokenClaimMutation = () => {
  return useMutation({
    mutationFn: signTokenClaim,
  });
};

export default useSignTokenClaimMutation;
