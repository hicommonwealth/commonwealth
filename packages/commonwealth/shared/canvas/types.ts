import { Action, Session } from '@canvas-js/interfaces';
import { configure as configureStableStringify } from 'safe-stable-stringify';

export type CanvasSignedData = {
  action: Action;
  session: Session;
  hash: string;
};

// maybe these fields should be called canvas_action, canvas_session, canvas_hash?
export type SerializedCanvasSignedData = {
  action: string;
  session: string;
  hash: string;
};

const sortedStringify = configureStableStringify({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

export const serializeCanvasSignedData = (
  data: CanvasSignedData,
): SerializedCanvasSignedData => ({
  session: sortedStringify(data.session),
  action: sortedStringify(data.action),
  // hash is already a string so it doesn't need to be serialized
  hash: data.hash,
});

export type CanvasSignedDataApiArgs = {
  canvas_action: string;
  canvas_session: string;
  canvas_hash: string;
};

export const toCanvasSignedDataApiArgs = (
  data: SerializedCanvasSignedData,
): CanvasSignedDataApiArgs => ({
  canvas_action: data.action,
  canvas_session: data.session,
  canvas_hash: data.hash,
});
