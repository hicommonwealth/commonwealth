import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { findAllRoles } from '../util/roles';

const communityStats = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community } = req;

  if (!req.user) {
    return next(new AppError('Not signed in'));
  }

  // TODO: factor this pattern into a util
  const userAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const adminRoles = await findAllRoles(
    models,
    { where: { address_id: { [Op.in]: userAddressIds } } },
    community.id,
    ['admin', 'moderator'],
  );
  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new AppError('Must be admin'));
  }

  const numberOfPrevDays = 28;

  // get new objects created over the last ${numberOfPrevDays} days
  const newObjectsQuery = async (table: string) => {
    return models.sequelize.query(
      `
      SELECT seq.date, COUNT(${table}.*) AS new_items
      FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${numberOfPrevDays}) AS seq(date) ) seq
      LEFT JOIN ${table} ON ${table}.created_at::date = seq.date
      WHERE ${table}.community_id = :communityId
      GROUP BY seq.date
      ORDER BY seq.date DESC;`,
      {
        type: QueryTypes.SELECT,
        replacements: { communityId: community.id },
      },
    );
  };
  const roles = await newObjectsQuery('"Addresses"');
  const threads = await newObjectsQuery('"Threads"');
  const comments = await newObjectsQuery('"Comments"');

  // get total number of roles, threads, and comments
  const totalObjectsQuery = async (table: string) => {
    return models.sequelize.query(
      `SELECT COUNT(id) AS new_items FROM ${table} WHERE community_id = :communityId;`,
      {
        type: QueryTypes.SELECT,
        replacements: { communityId: community.id },
      },
    );
  };
  const totalRoles = await totalObjectsQuery('"Addresses"');
  const totalThreads = await totalObjectsQuery('"Threads"');
  const totalComments = await totalObjectsQuery('"Comments"');

  // get number of active accounts by day
  const activeAccounts = await models.sequelize.query(
    `
SELECT seq.date, COUNT(DISTINCT objs.address_id) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${numberOfPrevDays}) AS seq(date) ) seq
LEFT JOIN (
  SELECT address_id, created_at FROM "Threads" WHERE created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND community_id = :communityId
  UNION
  SELECT address_id, created_at FROM "Comments" WHERE created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND community_id = :communityId
  UNION
  SELECT address_id, created_at FROM "Reactions" WHERE created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND community_id = :communityId
) objs
ON objs.created_at::date = seq.date
GROUP BY seq.date
ORDER BY seq.date DESC;
`,
    {
      type: QueryTypes.SELECT,
      replacements: { communityId: community.id },
    },
  );

  return res.json({
    status: 'Success',
    result: {
      roles,
      threads,
      comments,
      totalRoles,
      totalThreads,
      totalComments,
      activeAccounts,
    },
  });
};

export default communityStats;
