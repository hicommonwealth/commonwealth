import { CanvasSignedDataApiArgs, CanvasSignResult } from './types';
import { deserializeCanvas, serializeCanvas } from './utils';

export const fromCanvasSignedDataApiArgs = (
  data: CanvasSignedDataApiArgs,
): CanvasSignResult => {
  return {
    canvasSignedData: data.canvas_signed_data
      ? deserializeCanvas(data.canvas_signed_data)
      : undefined,
    canvasMsgId: data.canvas_msg_id,
  };
};

export const toCanvasSignedDataApiArgs = (
  data: null | undefined | CanvasSignResult,
): CanvasSignedDataApiArgs | undefined => {
  if (!data || !data.canvasSignedData || !data.canvasMsgId) {
    return;
  }

  const { canvasSignedData, canvasMsgId } = data;

  return {
    canvas_signed_data: serializeCanvas(canvasSignedData),
    canvas_msg_id: canvasMsgId,
  };
};

export const hasCanvasSignedDataApiArgs = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
): args is CanvasSignedDataApiArgs => {
  /**
   * There are three canvas signed data arguments: action, session and hash
   * The input is valid if either all three are present or all three are absent
   */

  if (
    args.canvas_signed_data === undefined &&
    args.canvas_msg_id === undefined
  ) {
    return false;
  }

  if (
    args.canvas_signed_data === undefined ||
    args.canvas_msg_id === undefined
  ) {
    throw new Error('Missing canvas signed data');
  }

  if (
    typeof args.canvas_signed_data !== 'string' ||
    typeof args.canvas_msg_id !== 'string'
  ) {
    throw new Error('Canvas signed data fields should be strings (if present)');
  }

  return true;
};
