import type {
  Action,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { ed25519 } from '@canvas-js/signatures';

import assert from 'assert';

import { topic } from './runtime/contract';
import { getSessionSignerForAddress } from './signers';
import { CanvasSignedData } from './types';
import { assertMatches } from './utils';

export const verifySession = async (session: Session) => {
  const signer = getSessionSignerForAddress(session.address);
  if (!signer) {
    throw new Error(`No signer for session ${session.address}`);
  }
  await signer.verifySession(topic, session);
};

export const verify = async ({
  actionMessage,
  actionMessageSignature,
  sessionMessage,
  sessionMessageSignature,
}: {
  actionMessage: Message<Action>;
  actionMessageSignature: Signature;
  sessionMessage: Message<Session>;
  sessionMessageSignature: Signature;
}) => {
  // verify the session
  await verifySession(sessionMessage.payload);

  assert(
    actionMessage.payload.address === sessionMessage.payload.address,
    'Action message must be signed by wallet address',
  );

  ed25519.verify(actionMessageSignature, actionMessage);
  ed25519.verify(sessionMessageSignature, sessionMessage);

  // if the session has an expiry, assert that the session is not expired
  if (sessionMessage.payload.duration !== null) {
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

export const verifyComment = async (
  canvasSignedData: CanvasSignedData,
  fields: any,
) => {
  const { thread_id, text, address, parent_comment_id } = fields;

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

  assertMatches(
    address,
    actionMessage.payload.address.split(':')[2],
    'comment',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyThread = async (
  canvasSignedData: CanvasSignedData,
  fields: any,
) => {
  const { title, body, address, community, link, topic } = fields;

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

  assertMatches(
    address,
    actionMessage.payload.address.split(':')[2],
    'thread',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyReaction = async (
  canvasSignedData: CanvasSignedData,
  fields: any,
) => {
  const { thread_id, comment_id, proposal_id, address, value } = fields;

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

  assertMatches(
    address,
    actionMessage.payload.address.split(':')[2],
    'reaction',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};
