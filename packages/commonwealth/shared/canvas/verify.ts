/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Action,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';

import assert from 'assert';
import { configure } from 'safe-stable-stringify';
import { CANVAS_TOPIC } from './constants';
export const stringify = configure({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

// can we do this without needing an async method?
// we should just be using ESM
const getSessionSigners = async () => {
  const { SIWESigner } = await import('@canvas-js/chain-ethereum');
  return [new SIWESigner()];
};

export async function verifySession(session: Session) {
  for (const signer of await getSessionSigners()) {
    if (signer.match(session.address)) {
      signer.verifySession(CANVAS_TOPIC, session);
      return;
    }
  }
  throw new Error(
    `No signer found for session with address ${session.address}`,
  );
}

type VerifyArgs = {
  actionMessage: Message<Action>;
  actionMessageSignature: Signature;
  sessionMessage: Message<Session>;
  sessionMessageSignature: Signature;
  expectedAddress: string;
};
export const verify = async ({
  actionMessage,
  actionMessageSignature,
  sessionMessage,
  sessionMessageSignature,
  expectedAddress,
}: VerifyArgs) => {
  const { verifySignedValue } = await import('@canvas-js/signed-cid');
  await verifySession(sessionMessage.payload);

  // assert address matches
  assert(
    actionMessage.payload.address === expectedAddress,
    'Action message must be signed by wallet address',
  );
  verifySignedValue(actionMessageSignature, actionMessage);
  assert(
    sessionMessage.payload.address === expectedAddress,
    'Session message must be signed by wallet address',
  );
  verifySignedValue(sessionMessageSignature, sessionMessage);

  const sessionExpirationTime =
    sessionMessage.payload.timestamp + sessionMessage.payload.duration;
  assert(
    actionMessage.payload.timestamp < sessionExpirationTime,
    'Invalid action: Signed by a session that was expired at the time of action',
  );
  assert(
    actionMessage.payload.timestamp >= sessionMessage.payload.timestamp,
    'Invalid action: Signed by a session after the action',
  );
};
