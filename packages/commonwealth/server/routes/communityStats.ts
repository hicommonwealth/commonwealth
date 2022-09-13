import { QueryTypes, Op }  from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';

const communityStats = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  if (!req.user) {
    return next(new AppError('Not logged in'));
  }

  // TODO: factor this pattern into a util
  const userAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);
  const adminRoles = await models.Role.findAll({
    where: {
      address_id: { [Op.in]: userAddressIds },
      permission: { [Op.in]: ['admin', 'moderator'] },
      chain_id: chain.id,
    },
  });
  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new AppError('Must be admin'));
  }

  // get new objects created over the last 14 days
  const newObjectsQuery = async (table) => {
    console.log(`SELECT seq.date, COUNT(${table}.*) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, 14) AS seq(date) ) seq
LEFT JOIN ${table} ON ${table}.created_at::date = seq.date
WHERE 'chain_id' = ?
GROUP BY seq.date
ORDER BY seq.date DESC;`);
    return models.sequelize.query(`SELECT seq.date, COUNT(${table}.*) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, 14) AS seq(date) ) seq
LEFT JOIN ${table} ON ${table}.created_at::date = seq.date
WHERE 'chain_id' = :chainOrCommunity
GROUP BY seq.date
ORDER BY seq.date DESC;`, {
      type: QueryTypes.SELECT,
      replacements: { chainOrCommunity: chain.id },
    });
  };
  const roles = await newObjectsQuery('"Roles"');
  const threads = await newObjectsQuery('"Threads"');
  const comments = await newObjectsQuery('"Comments"');

  // get total number of roles, threads, and comments as of today
  const totalObjectsQuery = async (table) => {
    return models.sequelize.query(
      `SELECT COUNT(id) AS new_items FROM ${table} WHERE 'chain_id' = :chainOrCommunity;`, {
        type: QueryTypes.SELECT,
        replacements: { chainOrCommunity: chain.id },
      }
    );
  };
  const totalRoles = await totalObjectsQuery('"Roles"');
  const totalThreads = await totalObjectsQuery('"Threads"');
  const totalComments = await totalObjectsQuery('"Comments"');

  // get number of active accounts by day
  const activeAccounts = await models.sequelize.query(`
SELECT seq.date, COUNT(DISTINCT objs.address_id) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, 14) AS seq(date) ) seq
LEFT JOIN (
  SELECT address_id, created_at FROM "Threads" WHERE created_at > CURRENT_DATE - 14
    AND ${chain ? 'chain' : 'community'} = :chainOrCommunity
  UNION
  SELECT address_id, created_at FROM "Comments" WHERE created_at > CURRENT_DATE - 14
    AND ${chain ? 'chain' : 'community'} = :chainOrCommunity
  UNION
  SELECT address_id, created_at FROM "Reactions" WHERE created_at > CURRENT_DATE - 14
    AND ${chain ? 'chain' : 'community'} = :chainOrCommunity
) objs
ON objs.created_at::date = seq.date
GROUP BY seq.date
ORDER BY seq.date DESC;
`, {
    type: QueryTypes.SELECT,
    replacements: { chainOrCommunity: chain.id },
  });

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
