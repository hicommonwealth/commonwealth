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
  console.log(req.query);
  // Threads
  let threads;
  if (req.query.cutoff_date) {
    let whereOptions = community
      ? `community = :community `
      : `chain = :chain AND root_id LIKE 'discussion%' `;

    const replacements = community
      ? { community: community.id }
      : { chain: chain.id };

    if (req.query.topic_id) {
      whereOptions += `AND topic_id = :topic_id `;
      replacements['topic_id'] = req.query.topic_id;
    }

    replacements['created_at'] = req.query.cutoff_date;

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
                AND pinned = FALSE
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
    const whereOptions = (community)
      ? { community: community.id, }
      : { chain: chain.id, };

    threads = await models.OffchainThread.findAll({
      where: whereOptions,
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
      order: [['created_at', 'DESC']],
    });
  }

  return res.json({ status: 'Success', result: threads.map((c) => c.toJSON()) });
};

export default bulkThreads;
