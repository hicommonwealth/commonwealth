/* eslint-disable dot-notation */
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const viewReactions = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (!req.query.thread_id && !req.query.comment_id) {
    return next(new Error('Must provide a comment or thread id'));
  }

  const options = {};
  if (community) options['community'] = community.id;
  else if (chain) options['chain'] = chain.id;
  if (req.query.thread_id) options['thread_id'] = req.query.thread_id;
  else if (req.query.community_id) options['comment_id'] = req.query.comment_id;

  const reactions = await models.OffchainReaction.findAll({
    where: options,
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: reactions.map((c) => c.toJSON()) });
};

export default viewReactions;
