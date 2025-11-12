import { Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
  WalletId,
  addressSwapper,
  getSessionSignerForDid,
} from '@hicommonwealth/shared';
import assert from 'assert';

/**
 * Verifies that the session signature is valid for the address model
 */
export const verifySessionSignature = async (
  session: Session,
  address: string,
  ss58_prefix?: number | null,
  options?: {
    walletId?: WalletId;
  },
): Promise<void> => {
  // Re-encode BOTH address if needed for substrate verification, to ensure matching
  // between stored address (re-encoded based on community joined at creation time)
  // and address provided directly from wallet.
  const expectedAddress = ss58_prefix
    ? addressSwapper({
        address,
        currentPrefix: 42,
      })
    : address;

  // Special handling for Sui wallet sessions
  if (session.did?.startsWith('did:pkh:sui:')) {
    // Extract the wallet address from the DID
    const [, , , , walletAddress] = session.did.split(':');

    assert(
      walletAddress === expectedAddress,
      `session.did address (${walletAddress}) does not match (${expectedAddress})`,
    );

    // For Sui wallet, we simply verify the address matches since we don't have a
    // proper Canvas.js signer implementation yet to verify the actual signature
    // When a proper signer is implemented, this should use that for verification
    return;
  }

  const signer = getSessionSignerForDid(session.did);
  if (!signer) throw new Error('Missing session signer');

  const sessionRawAddress = signer.getAddressFromDid(session.did);
  const walletAddress = ss58_prefix
    ? addressSwapper({
        address: sessionRawAddress,
        currentPrefix: 42,
      })
    : sessionRawAddress;

  assert(
    walletAddress === expectedAddress,
    `session.did address (${walletAddress}) does not match (${expectedAddress})`,
  );

  const walletId = options?.walletId;
  if (walletId && walletId === WalletId.Base) {
    // base Wallet uses passkey / smart-account signatures that are encoded as
    // ERC-4337 aggregator payloads. They cannot be verified with the legacy ECDSA check below,
    // so we skip the SIWE verification for now and rely on the DID/address match above.
    console.warn(
      `Skipping SIWE session signature verification for wallet ${walletId}; unsupported signature length`,
    );
    return;
  }

  await signer.verifySession(CANVAS_TOPIC, session);
};
