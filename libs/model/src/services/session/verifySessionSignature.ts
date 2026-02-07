import { Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
  addressSwapper,
  getSessionSignerForDid,
} from '@hicommonwealth/shared';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import assert from 'assert';

/**
 * Sui authorization data containing message and signature
 */
type SuiAuthorizationData = {
  message: string;
  signature: string;
};

/**
 * Verifies that the session signature is valid for the address model
 */
export const verifySessionSignature = async (
  session: Session,
  address: string,
  ss58_prefix?: number | null,
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

    // Verify the Sui signature cryptographically
    const suiAuthData = session.authorizationData as
      | SuiAuthorizationData
      | undefined;
    assert(
      suiAuthData?.message && suiAuthData?.signature,
      'Missing Sui session authorizationData (message or signature)',
    );

    const messageBytes = new TextEncoder().encode(suiAuthData.message);

    // The signature from the client is hex-encoded
    const isValid = await verifyPersonalMessageSignature(
      messageBytes,
      suiAuthData.signature,
    );

    assert(isValid, 'Invalid Sui session signature');
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

  await signer.verifySession(CANVAS_TOPIC, session);
};
