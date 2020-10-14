/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

// bulkThreads takes a date param and fetches the most recent 20 threads before that date
const bulkThreads = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  // Threads
  let threads;
  if (req.body.cutoffDate) {
    const whereOptions = community
      ? `community = :community`
      : `chain = :chain AND root_id LIKE 'discussion%'`;

    const replacements = community
      ? { community: community.id }
      : { chain: chain.id };

    replacements['created_at'] = req.body.cutoffDate;

    const query = `
      SELECT t.id
        FROM "OffchainThreads" AS t
        WHERE id in (
          SELECT CAST(TRIM('discussion_' FROM root_id) AS int)
          FROM (
            SELECT root_id, created_at, id
            FROM (
              SELECT root_id, MAX(created_at) as created_at 
              FROM "OffchainComments" 
              WHERE ${whereOptions}
                AND created_at < :created_at
                AND deleted_at IS NULL
              GROUP BY root_id) grouped_comments
            ORDER BY created_at DESC LIMIT 20
          ) ordered_comments
        );`;

    let threadIds;
    try {
      threadIds = await models.sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });
    } catch (e) {
      console.log(e);
    }

    threads = await models.OffchainThread.findAll({
      where: {
        id: {
          [Op.in]: threadIds.map((id) => id.id)
        }
      },
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
    });
  } else {
    const threadsQuery = (community)
      ? { community: community.id, }
      : { chain: chain.id, };

    threads = await models.OffchainThread.findAll({
      where: threadsQuery,
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
      order: [['created_at', 'DESC']],
    });
  }

  const userAddresses = await req.user.getAddresses();
  const userAddressIds = Array.from(userAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id));
  const rolesQuery = (community)
    ? { address_id: { [Op.in]: userAddressIds }, offchain_community_id: community.id, }
    : { address_id: { [Op.in]: userAddressIds }, chain_id: chain.id };
  const roles = await models.Role.findAll({
    where: rolesQuery
  });

  const adminRoles = roles.filter((r) => r.permission === 'admin' || r.permission === 'moderator');

  return res.json({ status: 'Success', result: threads.map((c) => c.toJSON()) });
};

export default bulkThreads;
