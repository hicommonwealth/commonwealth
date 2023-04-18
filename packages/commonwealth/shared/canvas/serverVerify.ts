import { getActionHash, getSessionHash } from '@canvas-js/interfaces';
import { chainBaseToCanvasChain } from "./chainMappings";
import { verify } from "./verify";
import { import_ } from "@brillout/import"

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "assertion failed");
  }
}

function assertMatches(a, b, obj: string, field: string) {
  assert(a === b, `Invalid signed ${obj} (${field}: ${JSON.stringify(a)}, ${JSON.stringify(b)})`);
}

const verifyUnpack = async (canvas_action, canvas_session, address) => {
  const { actionType, sessionType } = await import_('@canvas-js/core/codecs');
  const action = JSON.parse(canvas_action);
  const session = JSON.parse(canvas_session);
  assert(actionType.is(action), "Invalid signed action (typecheck)");
  assert(sessionType.is(session), "Invalid signed session (typecheck)");
  const [verifiedAction, verifiedSession] = await Promise.all([
    verify({ action, actionSignerAddress: action.session }),
    verify({ session })
  ]);
  assert(verifiedAction === true, "Invalid signed action (signature)");
  assert(verifiedSession === true, "Invalid signed session (signature)");
  assert(action.session === session.payload.sessionAddress, "Invalid action/session pair");
  return { action, session };
}

export const verifyComment = async (canvas_action, canvas_session, canvas_hash, fields) => {
  if (canvas_action === undefined && canvas_session === undefined && canvas_hash === undefined) return;
  const { thread_id, text, address, chain, parent_comment_id } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);

  assertMatches(action.payload.call, "comment", "comment", "call")
  assertMatches(thread_id, action.payload.callArgs.thread_id, "comment", "identifier")
  assertMatches(text, action.payload.callArgs.body, "comment", "text")
  assertMatches((parent_comment_id ?? null),
                (action.payload.callArgs.parent_comment_id ?? null), "comment", "parent")
  assertMatches(address, action.payload.from, "comment", "origin");
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
}

export const verifyThread = async (canvas_action, canvas_session, canvas_hash, fields) => {
  if (canvas_action === undefined && canvas_session === undefined && canvas_hash === undefined) return;
  const { title, body, address, chain, community, link, topic } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);

  assertMatches(action.payload.call, "thread", "thread", "call")
  assertMatches(community, action.payload.callArgs.community, "thread", "community")
  assertMatches(title, action.payload.callArgs.title, "thread", "title")
  assertMatches(body, action.payload.callArgs.body, "thread", "body")
  assertMatches(link ?? "", action.payload.callArgs.link, "thread", "link")
  assertMatches(topic ?? "", action.payload.callArgs.topic, "thread", "topic")
  assertMatches(address, action.payload.from, "thread", "origin");
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
}

export const verifyReaction = async (canvas_action, canvas_session, canvas_hash, fields) => {
  if (canvas_action === undefined && canvas_session === undefined && canvas_hash === undefined) return;
  const { thread_id, comment_id, proposal_id, address, chain, value } = fields;
  const { action, session } = await verifyUnpack(canvas_action, canvas_session, address);
  assert(
    (action.payload.call === "reactThread" &&
      thread_id === action.payload.callArgs.thread_id &&
      comment_id === undefined && proposal_id === undefined) ||
      (action.payload.call === "reactComment" &&
        comment_id === action.payload.callArgs.comment_id &&
        thread_id === undefined && proposal_id === undefined),
    "Invalid signed reaction (identifier)")
  assertMatches(value, action.payload.callArgs.value, "reaction", "value")
  assertMatches(address, action.payload.from, "reaction", "origin")
  // assertMatches(chainBaseToCanvasChain(chain), action.payload.chain)
}
