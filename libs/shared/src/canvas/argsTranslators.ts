import { CanvasSignedDataApiArgs, CanvasSignResult } from './types';
import { deserializeCanvas, serializeCanvas } from './utils';

export const fromCanvasSignedDataApiArgs = (
  data: CanvasSignedDataApiArgs,
): CanvasSignResult => ({
  canvasSignedData: deserializeCanvas(data.canvas_signed_data),
  canvasHash: data.canvas_hash,
});

export const toCanvasSignedDataApiArgs = (
  data: null | undefined | CanvasSignResult,
): CanvasSignedDataApiArgs => {
  // ignore undefined data
  if (data === undefined || data === null) {
    // @ts-expect-error <StrictNullChecks>
    return;
  }

  const { canvasSignedData, canvasHash } = data;

  return {
    canvas_signed_data: serializeCanvas(canvasSignedData),
    canvas_hash: canvasHash,
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
