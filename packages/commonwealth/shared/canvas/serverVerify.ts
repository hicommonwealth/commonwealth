import { getActionHash, getSessionHash } from '@canvas-js/interfaces';
import { chainBaseToCanvasChain } from "./chainMappings";
import { verify } from "./verify";
import { import_ } from "@brillout/import"

const APP = '';

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "assertion failed");
  }
}

const verifyUnpack = async (canvas_action, canvas_session, address) => {
  const { actionType, sessionType } = await import_('@canvas-js/core/codecs');
  const action = JSON.parse(canvas_action);
  const session = JSON.parse(canvas_session);
  assert(actionType.is(action), "Invalid signed action (typecheck failed)");
  assert(sessionType.is(session), "Invalid signed session (typecheck failed)");
  const [verifiedAction, verifiedSession] = await Promise.all([
    verify({ action, actionSignerAddress: action.session }),
    verify({ session })
  ]);
  assert(verifiedAction === true, "Invalid signed action");
  assert(verifiedSession === true, "Invalid signed session");
  assert(action.session === session.payload.sessionAddress, "Invalid action/session pair");
  return { action, session };
}

export const verifyComment = async (canvas_action, canvas_session, canvas_hash, fields) => {
  const { thread_id, text, address, chain, parent_comment_id } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);
  assert(action.payload.call === "comment" &&
    +thread_id === action.payload.callArgs.thread_id &&
    decodeURIComponent(text) === action.payload.callArgs.body &&
    parent_comment_id === (action.payload.callArgs.parent_comment_id ?? undefined));
  assert(address === action.payload.from);
  console.log('verifyComment success');
}

export const verifyThread = async (canvas_action, canvas_session, canvas_hash, fields) => {
  const { title, body, address, chain, community, link, topic } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);
  assert(action.payload.call === "thread" &&
    community || '' === action.payload.callArgs.community &&
    title === action.payload.callArgs.title &&
    body === action.payload.callArgs.body &&
    link || '' === action.payload.callArgs.link &&
    +topic || null === action.payload.callArgs.topic);
  assert(address === action.payload.from);
  console.log('verifyThread success');
}

export const verifyReaction = async (canvas_action, canvas_session, canvas_hash, fields) => {
  const { thread_id, comment_id, proposal_id, address, chain, value } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);
  assert(value === action.payload.callArgs.value)
  assert((action.payload.call === "reactThread" &&
    +thread_id === action.payload.callArgs.thread_id &&
    comment_id === undefined && proposal_id === undefined) ||
    (action.payload.call === "reactComment" &&
      +comment_id === action.payload.callArgs.comment_id &&
      comment_id === undefined && proposal_id === undefined))
  assert(address === action.payload.from)
  assert(chainBaseToCanvasChain(chain) === action.payload.chain)
  console.log('verifyReaction success')
}
