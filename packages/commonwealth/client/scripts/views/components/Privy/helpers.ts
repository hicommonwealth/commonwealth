import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  OAuthProvider,
  PrivySignInSSOProvider,
} from 'views/components/Privy/types';

const DEFAULT_WAIT_TIMEOUT = 5000;
const DEFAULT_POLL_INTERVAL = 100;

/**
 * Generic function to wait for a condition to be met with polling
 */
export async function waitForCondition<T>(
  checkCondition: () => T | null | undefined,
  timeout: number = DEFAULT_WAIT_TIMEOUT,
  interval: number = DEFAULT_POLL_INTERVAL,
): Promise<T | null> {
  // Check if condition is already met
  const initialResult = checkCondition();
  if (initialResult) return initialResult;

  let waitTime = 0;
  while (waitTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    waitTime += interval;

    const result = checkCondition();
    if (result) return result;
  }

  return null;
}

export function toSignInProvider(
  provider: WalletSsoSource | OAuthProvider,
): PrivySignInSSOProvider {
  switch (provider) {
    case 'google':
      return 'google_oauth';
    case 'github':
      return 'github_oauth';
    case 'discord':
      return 'discord_oauth';
    case 'twitter':
      return 'twitter_oauth';
    case 'apple':
      return 'apple_oauth';
    case 'email':
      return 'email';
    case 'farcaster':
      return 'farcaster';
    case 'SMS':
      return 'phone';
    default:
      throw new Error('Not supported: ' + provider);
  }
}

export function isOauthProvider(
  value: WalletSsoSource | OAuthProvider,
): value is OAuthProvider {
  switch (value) {
    case 'google':
    case 'github':
    case 'discord':
    case 'twitter':
    case 'apple':
      return true;
    default:
      return false;
  }
}

export async function waitForWallet(
  walletRef: React.RefObject<any>,
): Promise<boolean> {
  const result = await waitForCondition(() => walletRef.current);
  return !!result;
}

export async function waitForOAuthToken(
  provider: string,
  oAuthTokensRef: React.RefObject<Record<string, string>>,
): Promise<string | null> {
  return await waitForCondition(() => oAuthTokensRef.current?.[provider]);
}
