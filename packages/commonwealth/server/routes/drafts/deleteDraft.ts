import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';

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
