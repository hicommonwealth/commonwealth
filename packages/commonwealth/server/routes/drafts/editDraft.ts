/* eslint-disable no-restricted-syntax */
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';

export const Errors = {
  NoId: 'Must supply draft ID.',
  NotOwner: 'User does not have permission to edit this thread.',
  NotFound: 'Draft not found.',
};

const editDraft = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.id) {
    return next(new AppError(Errors.NoId));
  }

  const { id, title, body, topic } = req.body;

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const draft = await models.DiscussionDraft.findOne({
      where: {
        id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [models.Address],
    });
    if (!draft) return next(new AppError(Errors.NotFound));
    if (body) draft.body = body;
    if (title) draft.title = title;
    if (topic) draft.topic = topic;
    await draft.save();

    return res.json({ status: 'Success', result: draft.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editDraft;
