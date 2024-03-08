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

export const fromCanvasSignedDataApiArgs = (
  data: CanvasSignedDataApiArgs,
): CanvasSignedData => {
  // try to deserialize
  return {
    action: JSON.parse(data.canvas_action),
    session: JSON.parse(data.canvas_session),
    hash: data.canvas_hash,
  };
};

export const isCanvasSignedDataApiArgs = (
  args: any,
): args is CanvasSignedDataApiArgs => {
  /**
   * There are three canvas signed data arguments: action, session and hash
   * The input is valid if either all three are present or all three are absent
   */

  if (
    args.canvas_action === undefined &&
    args.canvas_session === undefined &&
    args.canvas_hash === undefined
  ) {
    return false;
  }

  if (
    args.canvas_action === undefined ||
    args.canvas_session === undefined ||
    args.canvas_hash === undefined
  ) {
    throw new Error('Missing canvas signed data');
  }

  if (
    typeof args.canvas_action !== 'string' ||
    typeof args.canvas_session !== 'string' ||
    typeof args.canvas_hash !== 'string'
  ) {
    throw new Error('Canvas signed data fields should be strings (if present)');
  }

  return true;
};
