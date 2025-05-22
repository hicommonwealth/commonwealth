import { useMobileRPCEventReceiver } from 'hooks/mobile/useMobileRPCEventReceiver';

export function usePrivyEthereumWalletOn() {
  return useMobileRPCEventReceiver<string[]>('privy.ethereumWalletOn');
}
