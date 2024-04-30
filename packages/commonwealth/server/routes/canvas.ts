import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

import {
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
} from 'shared/canvas/types';
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
(SELECT canvas_signed_data, canvas_hash as hash, updated_at
    FROM "Threads" WHERE canvas_signed_data IS NOT NULL AND updated_at < COALESCE(?, NOW())
    ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_signed_data, canvas_hash as hash, updated_at
    FROM "Comments" WHERE canvas_signed_data IS NOT NULL AND updated_at < COALESCE(?, NOW())
    ORDER BY updated_at DESC LIMIT 50)
UNION
(SELECT canvas_signed_data, canvas_hash as hash, updated_at
    FROM "Reactions" WHERE canvas_signed_data IS NOT NULL AND updated_at < COALESCE(?, NOW())
    ORDER BY updated_at DESC LIMIT 50)
ORDER BY updated_at DESC LIMIT 50;
`,
    { replacements: [before, before, before] },
  );

  type QueryResult = {
    canvas_signed_data: string;
    hash: string;
    updated_at: string;
  };
  const result = rows
    .map((row: QueryResult) => {
      try {
        return {
          canvas_signed_data: row.canvas_signed_data,
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

type CanvasPostReq = {};
type CanvasPostResp = {};

export const postCanvasData = async (
  models: DB,
  req: TypedRequestBody<CanvasPostReq>,
  res: TypedResponse<CanvasPostResp>,
) => {
  if (!hasCanvasSignedDataApiArgs(req.body)) {
    throw new Error('Invalid canvas data');
  }

  // verifyThread etc are also deserializing the canvas fields - we should just do
  // this once and pass the deserialized fields to the verify functions
  const { canvasSignedData } = await fromCanvasSignedDataApiArgs(req.body);
  const { actionMessage } = canvasSignedData;

  // TODO: Implement verification and call the create
  // thread/comment/reaction server method with POST data pre-filled.
  if (actionMessage.payload.name === 'thread') {
    await verifyThread(canvasSignedData, {});
  } else if (actionMessage.payload.name === 'comment') {
    await verifyComment(canvasSignedData, {});
  } else if (actionMessage.payload.name === 'reaction') {
    await verifyReaction(canvasSignedData, {});
  }

  // TODO: Return some kind of identifier for the generated data.
  const result = {};
  return success(res, result);
};
