/* eslint-disable @typescript-eslint/no-unused-vars */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import type {
  Action,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { ed25519 } from '@canvas-js/signatures';
import assert from 'assert';
import { configure } from 'safe-stable-stringify';
import { CANVAS_TOPIC } from './constants';
import {
  CosmosSignerCW,
  SolanaSignerCW,
  SubstrateSignerCW,
} from './sessionSigners';
export const stringify = configure({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

export const getSessionSigners = () => {
  return [
    new SIWESigner(),
    new CosmosSignerCW(),
    new SubstrateSignerCW(),
    new SolanaSignerCW(),
  ];
};

export const getSessionSignerForAddress = (address: string) => {
  const sessionSigners = getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(address)) {
      return signer;
    }
  }
};

export async function verifySession(session: Session) {
  for (const signer of getSessionSigners()) {
    if (signer.match(session.address)) {
      await signer.verifySession(CANVAS_TOPIC, session);
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
};
export const verify = async ({
  actionMessage,
  actionMessageSignature,
  sessionMessage,
  sessionMessageSignature,
}: VerifyArgs) => {
  // verify the session
  await verifySession(sessionMessage.payload);

  // assert address matches
  assert(
    actionMessage.payload.address === sessionMessage.payload.address,
    'Action message must be signed by wallet address',
  );

  // verify the action message and session message
  ed25519.verify(actionMessageSignature, actionMessage);
  ed25519.verify(sessionMessageSignature, sessionMessage);

  if (sessionMessage.payload.duration !== null) {
    // if the session has an expiry, assert that the session is not expired
    const sessionExpirationTime =
      sessionMessage.payload.timestamp + sessionMessage.payload.duration;
    assert(
      actionMessage.payload.timestamp < sessionExpirationTime,
      'Invalid action: Signed by a session that was expired at the time of action',
    );
  }
  assert(
    actionMessage.payload.timestamp >= sessionMessage.payload.timestamp,
    'Invalid action: Signed by a session after the action',
  );
};
