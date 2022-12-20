/* eslint-disable no-restricted-syntax */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import validateChain from '../../middleware/validateChain';
import { AppError, ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

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
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));

  if (!req.body.id) {
    return next(new AppError(Errors.NoId));
  }

  const { id, title, body, topic } = req.body;

  const attachFiles = async () => {
    if (
      req.body['attachments[]'] &&
      typeof req.body['attachments[]'] === 'string'
    ) {
      await models.Attachment.create({
        attachable: 'draft',
        attachment_id: id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(
        req.body['attachments[]'].map((url) =>
          models.Attachment.create({
            attachable: 'draft',
            attachment_id: id,
            url,
            description: 'image',
          })
        )
      );
    }
  };

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const draft = await models.DiscussionDraft.findOne({
      where: {
        id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [models.Address, models.Attachment],
    });
    if (!draft) return next(new AppError(Errors.NotFound));
    if (body) draft.body = body;
    if (title) draft.title = title;
    if (topic) draft.topic = topic;
    await draft.save();
    await attachFiles();

    return res.json({ status: 'Success', result: draft.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editDraft;
