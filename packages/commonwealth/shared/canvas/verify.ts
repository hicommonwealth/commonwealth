/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Action,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { verifySignedValue } from '@canvas-js/signed-cid';

import assert from 'assert';
import { configure } from 'safe-stable-stringify';
export const stringify = configure({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

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
  // get the signer? or assume this has already been done?
  sessionMessage.payload;

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
