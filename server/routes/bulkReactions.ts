import { Request, Response, NextFunction } from 'express';
import { Sequelize } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { uniqBy } from 'lodash'

const log = factory.getLogger(formatFilename(__filename));

const bulkReactions = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  // const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  // if (error) return next(new Error(error));
  const { thread_id, proposal_id, comment_id } = req.query
  let reactions = [];
  try {
    if (thread_id || proposal_id || comment_id) {
      reactions = await models.OffchainReaction.findAll({
        where: {
          thread_id: thread_id || null,
          proposal_id: proposal_id || null,
          comment_id: comment_id || null
        },
        include: [ models.Address ],
        order: [['created_at', 'DESC']],
      });
    }
  } catch (err) {
    return next(new Error(err));
  }

  return res.json({ status: 'Success', result: uniqBy(reactions.map((c) => c.toJSON()), 'id') });
};

export default bulkReactions;
