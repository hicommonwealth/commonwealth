import { PrivySignInSSOProvider } from 'views/components/Privy/types';

export function setPrivyActiveProvider(activeProvider: PrivySignInSSOProvider) {
  sessionStorage.setItem('privy-active-provider', activeProvider);
}

export function getPrivyActiveProvider(): PrivySignInSSOProvider | null {
  return sessionStorage.getItem(
    'privy-active-provider',
  ) as PrivySignInSSOProvider | null;
}
