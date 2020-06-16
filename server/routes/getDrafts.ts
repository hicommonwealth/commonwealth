import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
const log = factory.getLogger(formatFilename(__filename));

const getDiscussionDrafts = async (models, req: Request, res: Response, next: NextFunction) => {
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  const drafts = await models.DiscussionDraft.findAll({
    where: {
      author_id: author.id,
    },
    include: [ models.Address ],
  });

  return res.json({ status: 'Success', result: drafts });
};

export default getDiscussionDrafts;
