import { useMobileRPCSender } from 'hooks/mobile/useMobileRPCSender';

type RequestArguments = {
  method: string;
  params?: Array<any> | undefined;
};

export function usePrivyEthereumWalletRequest() {
  return useMobileRPCSender<RequestArguments, any>({
    type: 'privy.ethereumWalletRequest',
  });
}
