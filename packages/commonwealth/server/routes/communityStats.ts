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
    // @ts-expect-error StrictNullChecks
    { where: { address_id: { [Op.in]: userAddressIds } } },
    // @ts-expect-error StrictNullChecks
    community.id,
    ['admin', 'moderator'],
  );
  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new AppError('Must be admin'));
  }

  const numberOfPrevDays = 28;

  // get new objects created over the last ${numberOfPrevDays} days
  const newObjectsQuery = async (table: string) => {
    const isComments = table === '"Comments"';

    return models.sequelize.query(
      `
      SELECT seq.date, COUNT(tbl.*) AS new_items
      FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${numberOfPrevDays}) AS seq(date) ) seq
      LEFT JOIN ${table} tbl ON tbl.created_at::date = seq.date
      ${isComments ? 'LEFT JOIN "Threads" t on t.id = tbl.thread_id' : ''}
      WHERE ${isComments ? 't' : 'tbl'}.community_id = :communityId
      GROUP BY seq.date ${isComments ? ', t.community_id' : ''}
      ORDER BY seq.date DESC;`,
      {
        type: QueryTypes.SELECT,
        // @ts-expect-error StrictNullChecks
        replacements: { communityId: community.id },
      },
    );
  };
  const roles = await newObjectsQuery('"Addresses"');
  const threads = await newObjectsQuery('"Threads"');
  const comments = await newObjectsQuery('"Comments"');

  // get total number of roles, threads, and comments
  const totalObjectsQuery = async (table: string) => {
    const isComments = table === '"Comments"';

    return models.sequelize.query(
      `SELECT COUNT(tbl.id) AS new_items 
      FROM ${table} tbl 
      ${isComments ? 'LEFT JOIN "Threads" t on t.id = tbl.thread_id' : ''}
      WHERE ${isComments ? 't' : 'tbl'}.community_id = :communityId;`,
      {
        type: QueryTypes.SELECT,
        // @ts-expect-error StrictNullChecks
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
  SELECT 
    c.address_id, c.created_at 
    FROM "Comments" c 
    LEFT JOIN "Threads" t on t.id = c.thread_id  WHERE c.created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND t.community_id = :communityId
  UNION
  SELECT 
    r.address_id, r.created_at 
    FROM "Reactions" r 
    LEFT JOIN "Threads" t on t.id = r.thread_id WHERE r.created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND community_id = :communityId
) objs
ON objs.created_at::date = seq.date
GROUP BY seq.date
ORDER BY seq.date DESC;
`,
    {
      type: QueryTypes.SELECT,
      // @ts-expect-error StrictNullChecks
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
