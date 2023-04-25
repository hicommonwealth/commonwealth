import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import * as Sequelize from 'sequelize';

export const getCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasDataReq>,
  res: TypedResponse<CanvasDataResp>
) => {
  const before = req.params.before ?? null;

  const [result, metadata] = await models.sequelize.query(`
(SELECT canvas_action, canvas_session, canvas_hash, updated_at FROM "Threads" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW()) ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_action, canvas_session, canvas_hash, updated_at FROM "Comments" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW()) ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_action, canvas_session, canvas_hash, updated_at FROM "Reactions" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW()) ORDER BY updated_at DESC LIMIT 50)
ORDER BY updated_at DESC LIMIT 50;
`, { replacements: [before, before, before] });

  return res.json({
    status: 'Success',
    result
  });
};

export const postCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasDataReq>,
  res: TypedResponse<CanvasDataResp>
) => {
  const data = {}

  // branch:
  // create thread | create comment | create reaction

  return res.json({
    status: 'Success',
    result: {},
  });
};
