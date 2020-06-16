import { Request, Response, NextFunction } from 'express';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

enum DeleteDraftErrors {
  NoId = 'Must provide draft_id'
}

const deleteDraft = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  if (!req.body.id) {
    return next(new Error(DeleteDraftErrors.NoId));
  }

  try {
    const draft = await models.DiscussionDraft.findOne({
      where: {
        id: req.body.id,
        author_id: author.id
      },
    });
    await draft.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteDraft;
