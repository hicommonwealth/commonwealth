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
      SELECT 
          "a"."address", 
          "p"."profile_name", 
          COUNT(DISTINCT "t"."id") AS thread_count, 
          COUNT(DISTINCT "c"."id") AS comment_count, 
          COUNT(DISTINCT "r"."id") AS reaction_count
      FROM 
          "Addresses" "a"
      LEFT JOIN 
          "Profiles" "p" ON "a"."profile_id" = "p"."id"
      LEFT JOIN 
          "Threads" "t" ON "a"."id" = "t"."address_id" AND "t"."community_id" = :communityId
      LEFT JOIN 
          "Comments" "c" ON "a"."id" = "c"."address_id" AND "c"."community_id" = :communityId
      LEFT JOIN 
          "Reactions" "r" ON "a"."id" = "r"."address_id" AND "r"."community_id" = :communityId
      WHERE 
          "a"."community_id" = :communityId
      GROUP BY 
          "a"."address", "p"."profile_name"
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
