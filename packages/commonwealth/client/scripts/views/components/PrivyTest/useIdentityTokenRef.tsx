import { useIdentityToken } from '@privy-io/react-auth';
import { useValueRef } from 'views/components/PrivyTest/useValueRef';

export function useIdentityTokenRef() {
  const { identityToken } = useIdentityToken();
  return useValueRef(identityToken);
}
