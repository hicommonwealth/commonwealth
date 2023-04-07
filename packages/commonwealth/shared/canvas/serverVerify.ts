import esm from "esm";
import { getActionHash, getSessionHash } from '@canvas-js/interfaces';
import { chainBaseToCanvasChain } from "./chainMappings";
import { verify } from "./verify";
import { import_ } from "@brillout/import"

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
  // assert(verifiedAction === true, "Invalid signed action (signature mismatch)");
  assert(verifiedSession === true, "Invalid signed session (signature mismatch)");
  assert(action.session === session.payload.sessionAddress, "Invalid action/session pair");
  return { action, session };
}

export const verifyComment = async (canvas_action, canvas_session, canvas_hash, fields) => {
  if (canvas_action === undefined && canvas_session === undefined && canvas_hash === undefined) return;
  const { thread_id, text, address, chain, parent_comment_id } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);

  assert(action.payload.call, "comment",
    +thread_id, action.payload.callArgs.thread_id,
    text, action.payload.callArgs.body,
         parent_comment_id, (action.payload.callArgs.parent_comment_id ?? undefined))

  assert(action.payload.call === "comment" &&
    +thread_id === action.payload.callArgs.thread_id &&
    text === action.payload.callArgs.body &&
    parent_comment_id === (action.payload.callArgs.parent_comment_id ?? undefined),
         "Invalid signed comment");
  assert(address === action.payload.from, "Invalid signed comment, origin mismatch");
  // assert(chainBaseToCanvasChain(chain) === action.payload.chain)
}

export const verifyThread = async (canvas_action, canvas_session, canvas_hash, fields) => {
  if (canvas_action === undefined && canvas_session === undefined && canvas_hash === undefined) return;
  const { title, body, address, chain, community, link, topic } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);

  assert(action.payload.call === "thread" &&
    community || '' === action.payload.callArgs.community &&
    title === action.payload.callArgs.title &&
    body === action.payload.callArgs.body &&
    link || '' === action.payload.callArgs.link &&
    topic || null === action.payload.callArgs.topic,
                  "Invalid signed thread");
  assert(address === action.payload.from, "Invalid signed thread, origin mismatch");
  // assert(chainBaseToCanvasChain(chain) === action.payload.chain)
}

export const verifyReaction = async (canvas_action, canvas_session, canvas_hash, fields) => {
  if (canvas_action === undefined && canvas_session === undefined && canvas_hash === undefined) return;
  const { thread_id, comment_id, proposal_id, address, chain, value } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);
  assert(value === action.payload.callArgs.value)
  assert((action.payload.call === "reactThread" &&
    +thread_id === action.payload.callArgs.thread_id &&
    comment_id === undefined && proposal_id === undefined) ||
    (action.payload.call === "reactComment" &&
      +comment_id === action.payload.callArgs.comment_id &&
      comment_id === undefined && proposal_id === undefined),
         "Invalid signed reaction")
  assert(address === action.payload.from, "Invalid signed reaction, origin mismatch")
  // assert(chainBaseToCanvasChain(chain) === action.payload.chain)
}
