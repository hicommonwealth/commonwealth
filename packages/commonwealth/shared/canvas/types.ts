import { Action, Message, Session, Signature } from '@canvas-js/interfaces';
import { parse, stringify } from '@ipld/dag-json';

export type CanvasSignedData = {
  sessionMessage: Message<Session>;
  sessionMessageSignature: Signature;
  actionMessage: Message<Action>;
  actionMessageSignature: Signature;
};

export type CanvasSignResult = {
  canvasSignedData: CanvasSignedData;
  canvasHash: string;
};

// The `CanvasSignedData` and `Session` objects may contain data that cannot be
// automatically serialized by JSON, e.g. Uint8Array. We are using the IPLD dag-json codec
// to serialize and deserialize these objects.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serializeCanvas = (data: any): string => {
  return stringify(data);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deserializeCanvas = (serializedData: string): any => {
  return parse(serializedData);
};

export const toCanvasSignedDataApiArgs = (
  data: undefined | CanvasSignResult,
): CanvasSignedDataApiArgs => {
  // ignore undefined data
  if (data === undefined) {
    return;
  }

  const { canvasSignedData, canvasHash } = data;

  return {
    canvas_signed_data: serializeCanvas(canvasSignedData),
    canvas_hash: canvasHash,
  };
};

export type CanvasSignedDataApiArgs = {
  canvas_signed_data: string;
  canvas_hash: string;
};

export const fromCanvasSignedDataApiArgs = (
  data: CanvasSignedDataApiArgs,
): CanvasSignResult => ({
  canvasSignedData: deserializeCanvas(data.canvas_signed_data),
  canvasHash: data.canvas_hash,
});

export const hasCanvasSignedDataApiArgs = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
): args is CanvasSignedDataApiArgs => {
  /**
   * There are three canvas signed data arguments: action, session and hash
   * The input is valid if either all three are present or all three are absent
   */

  if (args.canvas_signed_data === undefined && args.canvas_hash === undefined) {
    return false;
  }

  if (args.canvas_signed_data === undefined || args.canvas_hash === undefined) {
    throw new Error('Missing canvas signed data');
  }

  if (
    typeof args.canvas_signed_data !== 'string' ||
    typeof args.canvas_hash !== 'string'
  ) {
    throw new Error('Canvas signed data fields should be strings (if present)');
  }

  return true;
};
