/* eslint-disable @typescript-eslint/no-unused-vars */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import { SolanaSigner } from '@canvas-js/chain-solana';
import type {
  Action,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { ed25519 } from '@canvas-js/signatures';

import assert from 'assert';

import { CosmosSignerCW, SubstrateSignerCW } from './sessionSigners';
import { CanvasSignedData } from './types';
import { CANVAS_TOPIC, assertMatches, didEquals } from './utils';

export const getSessionSigners = () => {
  return [
    new SIWESigner(),
    new CosmosSignerCW(),
    new SubstrateSignerCW(),
    new SolanaSigner(),
  ];
};

export const getSessionSignerForDid = (did: string) => {
  const sessionSigners = getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(did)) {
      return signer;
    }
  }
};

export async function verifySession(session: Session) {
  for (const signer of getSessionSigners()) {
    if (signer.match(session.did)) {
      await signer.verifySession(CANVAS_TOPIC, session);
      return;
    }
  }
  throw new Error(`No signer found for session with did ${session.did}`);
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
    didEquals(actionMessage.payload.did, sessionMessage.payload.did),
    'Action message must be signed by wallet address',
  );

  // verify the action message and session message
  ed25519.verify(actionMessageSignature, actionMessage);
  ed25519.verify(sessionMessageSignature, sessionMessage);

  if (sessionMessage.payload.context.duration !== undefined) {
    // if the session has an expiry, assert that the session is not expired
    const sessionExpirationTime =
      sessionMessage.payload.context.timestamp +
      (sessionMessage.payload.context.duration ?? 0);
    assert(
      actionMessage.payload.context.timestamp < sessionExpirationTime,
      'Invalid action: Signed by a session that was expired at the time of action',
    );
  }
  assert(
    actionMessage.payload.context.timestamp >=
      sessionMessage.payload.context.timestamp,
    'Invalid action: Signed by a session after the action',
  );
};

export const verifyComment = async (
  canvasSignedData: CanvasSignedData,
  fields,
) => {
  const { thread_id, text, did, parent_comment_id } = fields;

  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  assertMatches(actionMessage.payload.name, 'comment', 'comment', 'call');
  assertMatches(
    thread_id,
    actionMessage.payload.args.thread_id,
    'comment',
    'identifier',
  );
  assertMatches(text, actionMessage.payload.args.body, 'comment', 'text');
  assertMatches(
    parent_comment_id ?? null,
    actionMessage.payload.args.parent_comment_id ?? null,
    'comment',
    'parent',
  );

  assertMatches(did, actionMessage.payload.did, 'comment', 'origin');
};

export const verifyThread = async (
  canvasSignedData: CanvasSignedData,
  fields,
) => {
  const { title, body, did, community, link, topic } = fields;

  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  assertMatches(actionMessage.payload.name, 'thread', 'thread', 'call');
  assertMatches(
    community,
    actionMessage.payload.args.community,
    'thread',
    'community',
  );
  assertMatches(title, actionMessage.payload.args.title, 'thread', 'title');
  assertMatches(body, actionMessage.payload.args.body, 'thread', 'body');
  assertMatches(link ?? '', actionMessage.payload.args.link, 'thread', 'link');
  assertMatches(
    topic ?? '',
    actionMessage.payload.args.topic,
    'thread',
    'topic',
  );

  assertMatches(did, actionMessage.payload.did, 'thread', 'origin');
};

export const verifyReaction = async (
  canvasSignedData: CanvasSignedData,
  fields,
) => {
  const { thread_id, comment_id, proposal_id, did, value } = fields;

  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  assert(
    (actionMessage.payload.name === 'reactThread' &&
      thread_id === actionMessage.payload.args.thread_id &&
      comment_id === undefined &&
      proposal_id === undefined) ||
      (actionMessage.payload.name === 'reactComment' &&
        comment_id === actionMessage.payload.args.comment_id &&
        thread_id === undefined &&
        proposal_id === undefined),
    'Invalid signed reaction (identifier)',
  );
  assertMatches(value, actionMessage.payload.args.value, 'reaction', 'value');

  assertMatches(did, actionMessage.payload.did, 'reaction', 'origin');
};
