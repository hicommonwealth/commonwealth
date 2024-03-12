import { CanvasSignedDataApiArgs, fromCanvasSignedDataApiArgs } from './types';
import { verify } from './verify';

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

export const verifyComment = async (args: CanvasSignedDataApiArgs, fields) => {
  const { thread_id, text, address, parent_comment_id } = fields;
  const parsedCanvasArguments = fromCanvasSignedDataApiArgs(args);

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

export const verifyThread = async (args: CanvasSignedDataApiArgs, fields) => {
  const { title, body, address, community, link, topic } = fields;
  const parsedCanvasArguments = fromCanvasSignedDataApiArgs(args);

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

export const verifyReaction = async (args: CanvasSignedDataApiArgs, fields) => {
  const { thread_id, comment_id, proposal_id, address, value } = fields;
  const parsedCanvasArguments = fromCanvasSignedDataApiArgs(args);

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
