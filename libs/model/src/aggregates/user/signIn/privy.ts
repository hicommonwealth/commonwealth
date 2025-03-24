import { WalletSsoSource } from '@hicommonwealth/shared';
import { LinkedAccountWithMetadata, PrivyClient } from '@privy-io/server-auth';
import { config } from '../../../config';

export const privyClient = new PrivyClient(
  config.PRIVY.APP_ID!,
  config.PRIVY.APP_SECRET!,
);

const PrivySsoSourceMap: Partial<
  Record<LinkedAccountWithMetadata['type'], WalletSsoSource>
> = {
  apple_oauth: WalletSsoSource.Apple,
  google_oauth: WalletSsoSource.Google,
  twitter_oauth: WalletSsoSource.Twitter,
  discord_oauth: WalletSsoSource.Discord,
  github_oauth: WalletSsoSource.Github,
  phone: WalletSsoSource.SMS,
  farcaster: WalletSsoSource.Farcaster,
  email: WalletSsoSource.Email,
};

export function mapPrivyTypeToWalletSso(
  privyType: LinkedAccountWithMetadata['type'],
): WalletSsoSource {
  const walletSsoSource = PrivySsoSourceMap[privyType];
  if (!walletSsoSource)
    throw new Error(`Unsupported Privy SSO type: ${privyType}`);
  return walletSsoSource;
}
