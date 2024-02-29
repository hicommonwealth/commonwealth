import { Action, Message, Session, Signature } from '@canvas-js/interfaces';
import { verify } from './verify';

export type CanvasArguments = {
  canvas_action_message?: any;
  canvas_action_message_signature?: any;
  canvas_session_message?: any;
  canvas_session_message_signature?: any;
};

type ParsedCanvasArguments = {
  actionMessage: Message<Action>;
  actionMessageSignature: Signature;
  sessionMessage: Message<Session>;
  sessionMessageSignature: Signature;
};

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'assertion failed');
  }
}

function assertMatches(a, b, obj: string, field: string) {
  assert(
    a === b,
    `Invalid signed ${obj} (${field}: ${JSON.stringify(a)}, ${JSON.stringify(
      b,
    )})`,
  );
}

// Skip io-ts validation since it produces an import error even though
// we're already using an async import, and because we're upgrading
// to the new Canvas packages soon anyway.
export const unpackCanvasArguments = async ({
  canvas_action_message,
  canvas_action_message_signature,
  canvas_session_message,
  canvas_session_message_signature,
}: CanvasArguments): Promise<ParsedCanvasArguments> => {
  if (
    !canvas_action_message ||
    !canvas_action_message_signature ||
    !canvas_session_message ||
    !canvas_session_message_signature
  ) {
    return;
  }
  const ipldDagJson = await import('@ipld/dag-json');
  const actionMessage: Message<Action> = ipldDagJson.decode(
    ipldDagJson.parse(canvas_action_message),
  );
  const actionMessageSignature: Signature = ipldDagJson.decode(
    ipldDagJson.parse(canvas_action_message_signature),
  );

  const sessionMessage: Message<Session> = ipldDagJson.decode(
    ipldDagJson.parse(canvas_session_message),
  );
  const sessionMessageSignature: Signature = ipldDagJson.decode(
    ipldDagJson.parse(canvas_session_message_signature),
  );

  // TODO: run time type check these values
  return {
    actionMessage,
    actionMessageSignature,
    sessionMessage,
    sessionMessageSignature,
  };
};

export const verifyComment = async (
  parsedCanvasArguments: ParsedCanvasArguments,
  fields,
) => {
  const { thread_id, text, address, parent_comment_id } = fields;

  await verify(parsedCanvasArguments);

  const { actionMessage } = parsedCanvasArguments;
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
  assertMatches(address, actionMessage.payload.address, 'comment', 'origin');
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyThread = async (
  parsedCanvasArguments: ParsedCanvasArguments,
  fields,
) => {
  const { title, body, address, community, link, topic } = fields;

  await verify(parsedCanvasArguments);

  const { actionMessage } = parsedCanvasArguments;
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
  assertMatches(address, actionMessage.payload.address, 'thread', 'origin');
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyReaction = async (
  parsedCanvasArguments: ParsedCanvasArguments,
  fields,
) => {
  const { thread_id, comment_id, proposal_id, address, value } = fields;

  await verify(parsedCanvasArguments);

  const { actionMessage } = parsedCanvasArguments;
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
  assertMatches(address, actionMessage.payload.address, 'reaction', 'origin');
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};
