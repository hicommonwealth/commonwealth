import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const getCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasDataReq>,
  res: TypedResponse<CanvasDataResp>
) => {
  const data = {}

  return success(res, data);
};

export const postCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasDataReq>,
  res: TypedResponse<CanvasDataResp>
) => {
  const data = {}

  return success(res, data);
};
