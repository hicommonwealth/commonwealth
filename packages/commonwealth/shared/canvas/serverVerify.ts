import { bech32 } from 'bech32';
import { addressSwapper } from 'shared/utils';
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
  const { canvasSignedData } = await fromCanvasSignedDataApiArgs(args);

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

  // TODO: Can this be moved somewhere where it doesn't need to be repeated?
  let addressToCompare = address;
  if (actionMessage.payload.address.split(':')[0] == 'polkadot') {
    addressToCompare = addressSwapper({
      currentPrefix: 42,
      address: address,
    });
  }

  // if using cosmos, we need to convert the address so that it has the "cosmos" prefix
  if (actionMessage.payload.address.split(':')[0] == 'cosmos') {
    const { words } = bech32.decode(address);
    addressToCompare = bech32.encode('cosmos', words);
  }

  assertMatches(
    addressToCompare,
    actionMessage.payload.address.split(':')[2],
    'comment',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyThread = async (args: CanvasSignedDataApiArgs, fields) => {
  const { title, body, address, community, link, topic } = fields;
  const { canvasSignedData } = await fromCanvasSignedDataApiArgs(args);

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

  let addressToCompare = address;
  if (actionMessage.payload.address.split(':')[0] == 'polkadot') {
    addressToCompare = addressSwapper({
      currentPrefix: 42,
      address: address,
    });
  }

  // if using cosmos, we need to convert the address so that it has the "cosmos" prefix
  if (actionMessage.payload.address.split(':')[0] == 'cosmos') {
    const { words } = bech32.decode(address);
    addressToCompare = bech32.encode('cosmos', words);
  }

  assertMatches(
    addressToCompare,
    actionMessage.payload.address.split(':')[2],
    'thread',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};

export const verifyReaction = async (args: CanvasSignedDataApiArgs, fields) => {
  const { thread_id, comment_id, proposal_id, address, value } = fields;
  const { canvasSignedData } = await fromCanvasSignedDataApiArgs(args);

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

  let addressToCompare = address;
  if (actionMessage.payload.address.split(':')[0] == 'polkadot') {
    addressToCompare = addressSwapper({
      currentPrefix: 42,
      address: address,
    });
  }

  // if using cosmos, we need to convert the address so that it has the "cosmos" prefix
  if (actionMessage.payload.address.split(':')[0] == 'cosmos') {
    const { words } = bech32.decode(address);
    addressToCompare = bech32.encode('cosmos', words);
  }

  assertMatches(
    addressToCompare,
    actionMessage.payload.address.split(':')[2],
    'reaction',
    'origin',
  );
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
};
