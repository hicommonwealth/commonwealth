import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupAddressIsOwnedByUser from '../../util/lookupAddressIsOwnedByUser';
import validateChain from '../../util/validateChain';
import { factory, formatFilename } from 'common-common/src/logging';
import { AppError, ServerError } from '../../util/errors';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoId: 'Must provide id',
  NotOwner: 'User does not have permission to edit this draft',
  NotFound: 'No draft found for that user',
};

const deleteDraft = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new AppError(authorError));

  if (!req.body.id) {
    return next(new AppError(Errors.NoId));
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const draft = await models.DiscussionDraft.findOne({
      where: {
        id: req.body.id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
    if (!draft) {
      return next(new AppError(Errors.NotFound));
    }
    await draft.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteDraft;
