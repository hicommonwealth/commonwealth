import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupAddressIsOwnedByUser from '../../util/lookupAddressIsOwnedByUser';
import lookupCommunityIsVisibleToUser from '../../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoId: 'Must provide id',
  NotOwner: 'User does not have permission to edit this draft',
  NotFound: 'No draft found for that user'
};

const deleteDraft = async (models, req: Request, res: Response, next: NextFunction) => {
  const communityResult = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (typeof communityResult === 'string') return next(new Error(communityResult));
  const [chain, community] = communityResult;
  const author = await lookupAddressIsOwnedByUser(models, req);
  if (typeof author === 'string') return next(new Error(author));

  if (!req.body.id) {
    return next(new Error(Errors.NoId));
  }

  try {
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const draft = await models.DiscussionDraft.findOne({
      where: {
        id: req.body.id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
    if (!draft) {
      return next(new Error(Errors.NotFound));
    }
    await draft.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteDraft;
