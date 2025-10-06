import { useSignMessage } from '@privy-io/react-auth';
import { useMemoizedFunction } from 'views/components/Privy/useMemoizedFunction';

export function useSignMessageMemo() {
  const { signMessage } = useSignMessage();
  return useMemoizedFunction(signMessage);
}
