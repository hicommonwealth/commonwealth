import { Action, Message, Session, Signature } from '@canvas-js/interfaces';
import { decode, encode, parse, stringify } from '@ipld/dag-json';

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

export const toCanvasSignedDataApiArgs = async (
  data: undefined | CanvasSignResult,
): Promise<CanvasSignedDataApiArgs> => {
  // ignore undefined data
  if (data === undefined) {
    return;
  }

  const { canvasSignedData, canvasHash } = data;

  return {
    canvas_signed_data: stringify(encode(canvasSignedData)),
    canvas_hash: canvasHash,
  };
};

export type CanvasSignedDataApiArgs = {
  canvas_signed_data: string;
  canvas_hash: string;
};

export const fromCanvasSignedDataApiArgs = async (
  data: CanvasSignedDataApiArgs,
): Promise<CanvasSignResult> => {
  const canvasSignedData: CanvasSignedData = decode(
    parse(data.canvas_signed_data),
  );

  // try to deserialize
  return {
    canvasSignedData,
    canvasHash: data.canvas_hash,
  };
};

export const isCanvasSignedDataApiArgs = (
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
