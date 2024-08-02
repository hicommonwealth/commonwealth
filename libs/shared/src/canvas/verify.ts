import type {
  Action,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { ed25519 } from '@canvas-js/signatures';

import assert from 'assert';

import { topic } from './runtime/contract';
import { getSessionSignerForDid } from './signers';
import { CanvasSignedData } from './types';
import { assertMatches } from './utils';

export const verifySession = async (session: Session) => {
  const signer = getSessionSignerForDid(session.did);
  if (!signer) {
    throw new Error(`No signer for session ${session.did}`);
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
    actionMessage.payload.did === sessionMessage.payload.did,
    'Action message must be signed by wallet address',
  );

  ed25519.verify(actionMessageSignature, actionMessage);
  ed25519.verify(sessionMessageSignature, sessionMessage);

  // if the session has an expiry, assert that the session is not expired
  if (sessionMessage.payload.context.duration !== undefined) {
    const sessionExpirationTime =
      sessionMessage.payload.context.timestamp +
      sessionMessage.payload.context.duration;
    assert(
      actionMessage.payload.context.timestamp <= sessionExpirationTime,
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
  fields: {
    thread_id: number;
    text: string;
    address: string;
    parent_comment_id: string | null;
  },
) => {
  const { thread_id, text, address, parent_comment_id } = fields;

  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  assertMatches(actionMessage.payload.name, 'comment', 'comment', 'call');
  assertMatches(
    thread_id,
    actionMessage.payload.args.thread_id,
    'comment',
    'thread_id',
  );
  assertMatches(text, actionMessage.payload.args.body, 'comment', 'text');
  assertMatches(
    parent_comment_id ?? null,
    actionMessage.payload.args.parent_comment_id ?? null,
    'comment',
    'parent_comment_id',
  );

  assertMatches(
    address,
    actionMessage.payload.did.split(':')[4],
    'comment',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyDeleteComment = async (
  canvasSignedData: CanvasSignedData,
  fields: {
    comment_msg_id: string;
  },
) => {
  const { comment_msg_id } = fields;

  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  assertMatches(actionMessage.payload.name, 'deleteComment', 'comment', 'call');
  assertMatches(
    actionMessage.payload.args.commentId,
    comment_msg_id,
    'comment',
    'msgid',
  );

  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyThread = async (
  canvasSignedData: CanvasSignedData,
  fields: {
    title: string;
    body: string;
    address: string;
    community: string;
    topic: number | null;
  },
) => {
  const { title, body, address, community } = fields;
  const topic = fields.topic ?? '';

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
  assertMatches(topic, actionMessage.payload.args.topic, 'thread', 'topic');
  assertMatches(
    address,
    actionMessage.payload.did.split(':')[4],
    'thread',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyDeleteThread = async (
  canvasSignedData: CanvasSignedData,
  fields: {
    thread_msg_id: string;
  },
) => {
  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  assertMatches(actionMessage.payload.name, 'deleteThread', 'thread', 'call');
  assertMatches(
    actionMessage.payload.args.thread_id,
    fields.thread_msg_id,
    'thread',
    'id',
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
    actionMessage.payload.did.split(':')[4],
    'reaction',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyDeleteReaction = async (
  canvasSignedData: CanvasSignedData,
  fields: { comment_id: string } | { thread_id: string },
) => {
  await verify(canvasSignedData);

  const { actionMessage } = canvasSignedData;
  if (actionMessage.payload.name === 'unreactThread') {
    assertMatches(
      actionMessage.payload.args.thread_id,
      fields.thread_id,
      'reactThread',
      'thread_id',
    );
  } else if (actionMessage.payload.name === 'unreactComment') {
    assertMatches(
      actionMessage.payload.args.comment_id,
      fields.comment_id,
      'reactComment',
      'comment_id',
    );
  } else {
    throw new Error(
      `Invalid delete reaction action name: ${actionMessage.payload.name}`,
    );
  }

  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};
