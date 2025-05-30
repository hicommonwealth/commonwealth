import { useCallback } from 'react';
import { useConnectedWallet } from 'views/components/Privy/useConnectedWallet';

type Input = {
  message: string;
};

type Output = {
  signature: string;
};

export function useSignMessageWithRequestMemo() {
  const wallet = useConnectedWallet();

  return useCallback(
    async (input: Input, uiOpts?: any): Promise<Output> => {
      if (!wallet) {
        throw new Error('No connected wallet');
      }

      const provider = await wallet?.getEthereumProvider();

      console.log('FIXME: calling personal sign. ');
      const signature = await provider.request({
        method: 'personal_sign',
        params: [input.message, wallet.address],
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
