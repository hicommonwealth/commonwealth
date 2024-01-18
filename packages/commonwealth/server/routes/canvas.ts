import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

import type { Action, Session } from '@canvas-js/interfaces';
import {
  verifyComment,
  verifyReaction,
  verifyThread,
} from '../../shared/canvas/serverVerify';

type CanvasGetReq = {
  query: {
    before: string;
  };
};
type CanvasGetResp = unknown;

export const getCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasGetReq>,
  res: TypedResponse<CanvasGetResp>,
) => {
  const before = req.body.query?.before ?? null;

  const [rows] = await models.sequelize.query(
    `
(SELECT canvas_action as action, canvas_session as session, canvas_hash as hash, updated_at
    FROM "Threads" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW())
    ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_action as action, canvas_session as session, canvas_hash as hash, updated_at
    FROM "Comments" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW())
    ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_action as action, canvas_session as session, canvas_hash as hash, updated_at
    FROM "Reactions" WHERE canvas_action IS NOT NULL AND updated_at < COALESCE(?, NOW())
    ORDER BY updated_at DESC LIMIT 50)
ORDER BY updated_at DESC LIMIT 50;
`,
    { replacements: [before, before, before] },
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

  return success(res, result);
};

type CanvasPostReq = {
  canvas_action: Action;
  canvas_session: Session;
  canvas_hash: string;
};
type CanvasPostResp = {};

export const postCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasPostReq>,
  res: TypedResponse<CanvasPostResp>,
) => {
  const { canvas_action, canvas_session, canvas_hash } = req.body;

  // TODO: Implement verification and call the create
  // thread/comment/reaction server method with POST data pre-filled.
  if (canvas_action.payload.call === 'thread') {
    await verifyThread(canvas_action, canvas_session, canvas_hash, {});
  } else if (canvas_action.payload.call === 'comment') {
    await verifyComment(canvas_action, canvas_session, canvas_hash, {});
  } else if (canvas_action.payload.call === 'reaction') {
    await verifyReaction(canvas_action, canvas_session, canvas_hash, {});
  }

  // TODO: Return some kind of identifier for the generated data.
  const result = {};
  return success(res, result);
};
