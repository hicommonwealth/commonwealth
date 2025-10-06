import { useMobileRPCSender } from 'hooks/mobile/useMobileRPCSender';

type RequestArguments = {
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Array<any> | undefined;
};

export function usePrivyEthereumWalletRequest() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMobileRPCSender<RequestArguments, any>({
    type: 'privy.ethereumWalletRequest',
  });
}
