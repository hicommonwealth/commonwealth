import { Action, Message, Session, Signature } from '@canvas-js/interfaces';

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

export type CanvasSignedDataApiArgs = {
  canvas_signed_data: string;
  canvas_hash: string;
};
