import { Action, Message, Session, Signature } from '@canvas-js/interfaces';

export type CanvasSignedData = {
  sessionMessage: Message<Session>;
  sessionMessageSignature: Signature;
  actionMessage: Message<Action>;
  actionMessageSignature: Signature;
};

export const toCanvasSignedDataApiArgs = async (
  data: undefined | CanvasSignedData,
): Promise<CanvasSignedDataApiArgs> => {
  const { encode, stringify } = await import('@ipld/dag-json');
  // ignore undefined data
  if (data === undefined) {
    return;
  }

  return {
    canvas_action_message: stringify(encode(data.actionMessage)),
    canvas_action_message_signature: stringify(
      encode(data.actionMessageSignature),
    ),
    canvas_session_message: stringify(encode(data.sessionMessage)),
    canvas_session_message_signature: stringify(
      encode(data.sessionMessageSignature),
    ),
  };
};

export type CanvasSignedDataApiArgs = {
  canvas_action_message: string;
  canvas_action_message_signature: string;
  canvas_session_message: string;
  canvas_session_message_signature: string;
};

export const fromCanvasSignedDataApiArgs = async (
  data: CanvasSignedDataApiArgs,
): Promise<CanvasSignedData> => {
  const { decode, parse } = await import('@ipld/dag-json');
  // try to deserialize
  return {
    actionMessage: decode(parse(data.canvas_action_message)),
    actionMessageSignature: decode(parse(data.canvas_action_message_signature)),
    sessionMessage: decode(parse(data.canvas_session_message)),
    sessionMessageSignature: decode(
      parse(data.canvas_session_message_signature),
    ),
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
    args.canvas_action_message === undefined &&
    args.canvas_action_message_signature === undefined &&
    args.canvas_session_message === undefined &&
    args.canvas_session_message_signature === undefined
  ) {
    return false;
  }

  if (
    args.canvas_action_message === undefined ||
    args.canvas_action_message_signature === undefined ||
    args.canvas_session_message === undefined ||
    args.canvas_session_message_signature === undefined
  ) {
    throw new Error('Missing canvas signed data');
  }

  if (
    typeof args.canvas_action_message !== 'string' ||
    typeof args.canvas_action_message_signature !== 'string' ||
    typeof args.canvas_session_message !== 'string' ||
    typeof args.canvas_session_message_signature !== 'string'
  ) {
    throw new Error('Canvas signed data fields should be strings (if present)');
  }

  return true;
};
