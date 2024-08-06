import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NotAdmin: 'Must be a site admin',
  CannotExportMembersList: 'Cannot export members list',
  NoCommunity: 'Community not found',
};

type exportMembersListReq = {
  communityId: string;
};

type exportMembersListResp = {
  data: any;
};

const exportMembersList = async (
  models: DB,
  req: TypedRequestBody<exportMembersListReq>,
  res: TypedResponse<exportMembersListResp>,
  next: NextFunction,
) => {
  // @ts-expect-error StrictNullChecks
  if (!req.user.isAdmin) {
    return next(new AppError(Errors.NotAdmin));
  }

  const { communityId } = req.body;

  const community = await models.Community.findOne({
    where: {
      id: communityId,
    },
  });

  if (!community) {
    return next(new AppError(Errors.NoCommunity));
  }

  try {
    const data = await models.sequelize.query(
      `
WITH A AS (
  SELECT
    a.id, 
    a.address, 
    u.profile->>'name' AS profile_name 
  FROM 
    "Addresses" a
    LEFT JOIN "Users" u ON a.user_id = u.id
  WHERE 
    a.community_id = :communityId
),
T AS (SELECT id, address_id from "Threads" where community_id = :communityId)
SELECT 
  A.address, 
  A.profile_name, 
  COUNT(DISTINCT T.id) AS thread_count,
  COUNT(DISTINCT c.id) AS comment_count,
  COUNT(DISTINCT tr.id)  + COUNT(DISTINCT cr.id) AS reaction_count
FROM 
  A
  LEFT JOIN T ON A.id = T.address_id
  LEFT JOIN "Comments" c ON A.id = c.address_id AND T.id = c.thread_id 
  LEFT JOIN "Reactions" tr ON A.id = tr.address_id AND T.id = tr.thread_id 
  LEFT JOIN "Reactions" cr ON A.id = cr.address_id 
  LEFT JOIN "Comments" crc ON cr.comment_id = crc.id AND T.id =crc.thread_id 
GROUP BY 
  A.address,
  A.profile_name;
    `,
      {
        replacements: { communityId },
      },
    );

    return success(res, { data });
  } catch (e) {
    console.log(e);
    return next(new AppError(Errors.CannotExportMembersList));
  }
};

export default exportMembersList;
