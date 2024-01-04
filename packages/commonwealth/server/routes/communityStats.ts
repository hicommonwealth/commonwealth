import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

const communityStats = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const chain = req.chain;

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
    chain.id,
    ['admin', 'moderator'],
  );
  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new AppError('Must be admin'));
  }

  const numberOfPrevDays = 28;

  // get new objects created over the last ${numberOfPrevDays} days
  const newObjectsQuery = async (table, chainName) => {
    return models.sequelize.query(
      `SELECT seq.date, COUNT(${table}.*) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${numberOfPrevDays}) AS seq(date) ) seq
LEFT JOIN ${table} ON ${table}.created_at::date = seq.date
WHERE ${table}.${chainName} = :chainOrCommunity
GROUP BY seq.date
ORDER BY seq.date DESC;`,
      {
        type: QueryTypes.SELECT,
        replacements: { chainOrCommunity: chain.id, chainName: chainName },
      },
    );
  };
  const roles = await newObjectsQuery('"Addresses"', 'community_id');
  const threads = await newObjectsQuery('"Threads"', 'chain');
  const comments = await newObjectsQuery('"Comments"', 'chain');

  // get total number of roles, threads, and comments
  const totalObjectsQuery = async (table, chainName) => {
    return models.sequelize.query(
      `SELECT COUNT(id) AS new_items FROM ${table} WHERE ${chainName} = :chainOrCommunity;`,
      {
        type: QueryTypes.SELECT,
        replacements: { chainOrCommunity: chain.id },
      },
    );
  };
  const totalRoles = await totalObjectsQuery('"Addresses"', 'community_id');
  const totalThreads = await totalObjectsQuery('"Threads"', 'chain');
  const totalComments = await totalObjectsQuery('"Comments"', 'chain');

  // get number of active accounts by day
  const activeAccounts = await models.sequelize.query(
    `
SELECT seq.date, COUNT(DISTINCT objs.address_id) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${numberOfPrevDays}) AS seq(date) ) seq
LEFT JOIN (
  SELECT address_id, created_at FROM "Threads" WHERE created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND ${chain ? 'chain' : 'community'} = :chainOrCommunity
  UNION
  SELECT address_id, created_at FROM "Comments" WHERE created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND ${chain ? 'chain' : 'community'} = :chainOrCommunity
  UNION
  SELECT address_id, created_at FROM "Reactions" WHERE created_at > CURRENT_DATE - ${numberOfPrevDays}
    AND community_id = :chainOrCommunity
) objs
ON objs.created_at::date = seq.date
GROUP BY seq.date
ORDER BY seq.date DESC;
`,
    {
      type: QueryTypes.SELECT,
      replacements: { chainOrCommunity: chain.id },
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
