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

// eslint-disable-next-line import/no-cycle
import { CosmosSignerCW, SubstrateSignerCW } from './sessionSigners';
import { CanvasSignedData } from './types';
import { CANVAS_TOPIC, assertMatches, caip2AddressEquals } from './utils';

export const getSessionSigners = () => {
  return [
    new SIWESigner(),
    new CosmosSignerCW(),
    new SubstrateSignerCW(),
    new SolanaSigner(),
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

export const verifySession = async (session: Session) => {
  const signer = getSessionSignerForAddress(session.address);

  if (!signer) {
    throw new Error(
      `No signer found for session with address ${session.address}`,
    );
  }

  await signer.verifySession(CANVAS_TOPIC, session);
};

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
    caip2AddressEquals(
      actionMessage.payload.address,
      sessionMessage.payload.address,
    ),
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

export const verifyComment = async (
  canvasSignedData: CanvasSignedData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
