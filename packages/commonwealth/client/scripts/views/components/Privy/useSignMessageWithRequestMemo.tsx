import { useCallback } from 'react';
import { useConnectedWallet } from 'views/components/Privy/useConnectedWallet';

export function useSignMessageWithRequestMemo() {
  const wallet = useConnectedWallet();

  return useCallback(
    async (message: string): Promise<{ signature: string }> => {
      if (!wallet) {
        throw new Error('No connected wallet');
      }

      const provider = await wallet?.getEthereumProvider();

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, wallet.address],
      });

      if (typeof signature === 'string') {
        // the result type of signMessage is wrong.
        return { signature };
      }
      throw new Error('Wrong result type.');
    },
    [wallet],
  );
}
