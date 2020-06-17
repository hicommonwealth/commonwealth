import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  MutuallyExclusive: 'Cannot select mutually exclusive offchain threads and proposals only options',
};

const bulkComments = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (req.query.offchain_threads_only && req.query.proposals_only) {
    return next(new Error(Errors.MutuallyExclusive));
  }
  const whereOptions: any = {};
  if (community) {
    whereOptions.community = community.id;
  } else {
    whereOptions.chain = chain.id;
    if (req.query.offchain_threads_only) {
      whereOptions.root_id = { [Op.like]: 'discussion%' };
    } else if (req.query.proposals_only) {
      whereOptions.root_id = { [Op.notLike]: 'discussion%' };
    }
  }
  const comments = await models.OffchainComment.findAll({
    where: whereOptions,
    include: [ models.Address, models.OffchainAttachment ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: comments.map((c) => c.toJSON()) });
};

export default bulkComments;
