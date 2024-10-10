import type { Session } from '@canvas-js/interfaces';
import { ed25519 } from '@canvas-js/signatures';

import assert from 'assert';

import { contractTopic } from './runtime/contract';
import { getSessionSignerForDid } from './signers';
import { CanvasSignedData, CanvasSignedDataOption } from './types';
import { assertMatches } from './utils';

export const verifySession = async (session: Session) => {
  const signer = getSessionSignerForDid(session.did);
  if (!signer) {
    throw new Error(`No signer for session ${session.did}`);
  }
  await signer.verifySession(contractTopic, session);
};

const isSigned = (data: CanvasSignedDataOption): data is CanvasSignedData => {
  return data !== undefined;
};

export const verify = async (canvasSignedData: CanvasSignedDataOption) => {
  if (!canvasSignedData) throw new Error('No signed data provided');

  const {
    actionMessage,
    actionMessageSignature,
    sessionMessage,
    sessionMessageSignature,
  } = canvasSignedData;

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
  canvasSignedData: CanvasSignedDataOption,
  fields: {
    thread_id: string | null;
    text: string;
    address: string;
    parent_comment_id: string | null;
  },
) => {
  const { thread_id, text, address, parent_comment_id } = fields;

  await verify(canvasSignedData);
  assert(isSigned(canvasSignedData));

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
  canvasSignedData: CanvasSignedDataOption,
  fields: {
    comment_id: string;
  },
) => {
  const { comment_id } = fields;

  await verify(canvasSignedData);
  assert(isSigned(canvasSignedData));

  const { actionMessage } = canvasSignedData;
  assert(isSigned(canvasSignedData));
  assertMatches(actionMessage.payload.name, 'deleteComment', 'comment', 'call');
  assertMatches(
    actionMessage.payload.args.comment_id,
    comment_id,
    'comment',
    'msgid',
  );

  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyThread = async (
  canvasSignedData: CanvasSignedDataOption,
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
  assert(isSigned(canvasSignedData));

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
  canvasSignedData: CanvasSignedDataOption,
  fields: {
    thread_id: string;
  },
) => {
  await verify(canvasSignedData);
  assert(isSigned(canvasSignedData));

  const { actionMessage } = canvasSignedData;
  assertMatches(actionMessage.payload.name, 'deleteThread', 'thread', 'call');
  assertMatches(
    actionMessage.payload.args.thread_id,
    fields.thread_id,
    'thread',
    'id',
  );

  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyReaction = async (
  canvasSignedData: CanvasSignedDataOption,
  fields:
    | { comment_id: string | null; value: string; address: string }
    | { thread_id: string | null; value: string; address: string },
) => {
  await verify(canvasSignedData);

  const isComment = (
    f:
      | { comment_id: string | null; value: string; address: string }
      | { thread_id: string | null; value: string; address: string },
  ): f is { comment_id: string | null; value: string; address: string } => {
    return 'comment_id' in f && !('thread_id' in f) && !('proposal_id' in f);
  };
  const isThread = (
    f:
      | { comment_id: string | null; value: string; address: string }
      | { thread_id: string | null; value: string; address: string },
  ): f is { thread_id: string | null; value: string; address: string } => {
    return 'thread_id' in f && !('comment_id' in f) && !('proposal_id' in f);
  };
  assert(isSigned(canvasSignedData));

  const { actionMessage } = canvasSignedData;
  assert(
    (isThread(fields) &&
      actionMessage.payload.name === 'reactThread' &&
      fields.thread_id === actionMessage.payload.args.thread_id) ||
      (isComment(fields) &&
        actionMessage.payload.name === 'reactComment' &&
        fields.comment_id === actionMessage.payload.args.comment_id),
    'Invalid signed reaction (identifier)',
  );
  assertMatches(
    fields.value,
    actionMessage.payload.args.value,
    'reaction',
    'value',
  );

  assertMatches(
    fields.address,
    actionMessage.payload.did.split(':')[4],
    'reaction',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyDeleteReaction = async (
  canvasSignedData: CanvasSignedDataOption,
  fields: { comment_id: string } | { thread_id: string },
) => {
  await verify(canvasSignedData);
  assert(isSigned(canvasSignedData));

  const isComment = (
    f: { comment_id: string } | { thread_id: string },
  ): f is { comment_id: string } => {
    return 'comment_id' in f;
  };
  const isThread = (
    f: { comment_id: string } | { thread_id: string },
  ): f is { thread_id: string } => {
    return 'thread_id' in f;
  };

  const { actionMessage } = canvasSignedData;
  if (actionMessage.payload.name === 'unreactThread' && isThread(fields)) {
    assertMatches(
      actionMessage.payload.args.thread_id,
      fields.thread_id,
      'reactThread',
      'thread_id',
    );
  } else if (
    actionMessage.payload.name === 'unreactComment' &&
    isComment(fields)
  ) {
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
