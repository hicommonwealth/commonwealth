import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

const communityStats = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  // get new objects created over the last 14 days
  const newObjectsQuery = async (table, chainParam = 'chain_id', communityParam = 'offchain_community_id') => {
    console.log(`SELECT seq.date, COUNT(${table}.*) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, 14) AS seq(date) ) seq
LEFT JOIN ${table} ON ${table}.created_at::date = seq.date
WHERE ${chainParam} = ? AND ${communityParam} = ?
GROUP BY seq.date
ORDER BY seq.date DESC;`);
    return models.sequelize.query(`SELECT seq.date, COUNT(${table}.*) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, 14) AS seq(date) ) seq
LEFT JOIN ${table} ON ${table}.created_at::date = seq.date
WHERE ${chain ? chainParam : communityParam} = ?
GROUP BY seq.date
ORDER BY seq.date DESC;`, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: chain ? [ chain.id ] : [ community.id ]
    });
  };
  const roles = await newObjectsQuery('"Roles"');
  const threads = await newObjectsQuery('"OffchainThreads"', 'chain', 'community');
  const comments = await newObjectsQuery('"OffchainComments"', 'chain', 'community');

  // get total number of roles, threads, and comments as of today
  const totalObjectsQuery = async (table, chainParam = 'chain_id', communityParam = 'offchain_community_id') => {
    return models.sequelize.query(
      `SELECT COUNT(id) AS new_items FROM ${table} WHERE ${chain ? chainParam : communityParam} = ?;`, {
        type: models.sequelize.QueryTypes.SELECT,
        replacements: chain ? [ chain.id ] : [ community.id ]
      }
    );
  };
  const totalRoles = await totalObjectsQuery('"Roles"');
  const totalThreads = await totalObjectsQuery('"OffchainThreads"', 'chain', 'community');
  const totalComments = await totalObjectsQuery('"OffchainComments"', 'chain', 'community');

  // get number of active accounts by day
  const activeAccounts = await models.sequelize.query(`
SELECT seq.date, COUNT(DISTINCT objs.address_id) AS new_items
FROM ( SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, 14) AS seq(date) ) seq
LEFT JOIN (
  SELECT address_id, created_at FROM "OffchainThreads" WHERE created_at > CURRENT_DATE - 14
    AND ${chain ? 'chain' : 'community'} = ?
  UNION
  SELECT address_id, created_at FROM "OffchainComments" WHERE created_at > CURRENT_DATE - 14
    AND ${chain ? 'chain' : 'community'} = ?
  UNION
  SELECT address_id, created_at FROM "OffchainReactions" WHERE created_at > CURRENT_DATE - 14
    AND ${chain ? 'chain' : 'community'} = ?
) objs
ON objs.created_at::date = seq.date
GROUP BY seq.date
ORDER BY seq.date DESC;
`, {
    type: models.sequelize.QueryTypes.SELECT,
    replacements: chain ? [ chain.id, chain.id, chain.id ] : [ community.id, community.id, community.id ]
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
