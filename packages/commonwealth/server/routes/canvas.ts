import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import * as Sequelize from 'sequelize';

type CanvasDataReq = {
  query: {
    before: string;
  };
};
type CanvasDataResp = {};

export const getCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasDataReq>,
  res: TypedResponse<CanvasDataResp>
) => {
  const before = req.body.query?.before ?? null;

  const [rows, metadata] = await models.sequelize.query(
    `
(SELECT canvas_action as action, canvas_session as session, canvas_hash as hash, updated_at FROM "Threads" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW()) ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_action as action, canvas_session as session, canvas_hash as hash, updated_at FROM "Comments" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW()) ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_action as action, canvas_session as session, canvas_hash as hash, updated_at FROM "Reactions" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW()) ORDER BY updated_at DESC LIMIT 50)
ORDER BY updated_at DESC LIMIT 50;
`,
    { replacements: [before, before, before] }
  );

  type QueryResult = {
    action: string;
    session: string;
    hash: string;
    updated_at: string;
  };
  const result = rows
    .map((row: QueryResult) => {
      try {
        return {
          action: JSON.parse(row.action),
          session: JSON.parse(row.session),
          hash: row.hash,
          updated_at: row.updated_at,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((value) => value !== null);

  return res.json({
    status: 'Success',
    result,
  });
};

export const postCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasDataReq>,
  res: TypedResponse<CanvasDataResp>
) => {
  const data = {};

  // branch:
  // create thread | create comment | create reaction

  return res.json({
    status: 'Success',
    result: {},
  });
};
