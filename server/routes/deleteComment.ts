import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const deleteComment = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.comment_id) {
    return next(new Error('Must provide comment_id'));
  }

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const comment = await models.OffchainComment.findOne({
      where: { id: req.body.comment_id, },
      include: [ models.Address ],
    });
    if (userOwnedAddresses.filter((addr) => addr.verified).map((addr) => addr.id).indexOf(comment.address_id) === -1) {
      return next(new Error('Not owned by this user'));
    }
    // actually delete
    await comment.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteComment;
