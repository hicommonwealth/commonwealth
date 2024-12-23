import { Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
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

  const sessionRawAddress = session.did.split(':')[4];
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

  const signer = getSessionSignerForDid(session.did);
  if (!signer) throw new Error('Missing session signer');
  await signer.verifySession(CANVAS_TOPIC, session);
};
