import { Request, Response, NextFunction } from 'express';

import validateChain from '../../util/validateChain';
import lookupAddressIsOwnedByUser from '../../util/lookupAddressIsOwnedByUser';
import { factory, formatFilename } from 'common-common/src/logging';
import { AppError, ServerError } from '../../util/errors';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InsufficientData: 'Drafts must include title, body, or attachment',
};

const createDraft = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new AppError(authorError));
  const { title, body, topic } = req.body;

  if (!title && !body && !req.body['attachments[]']?.length) {
    return next(new AppError(Errors.InsufficientData));
  }

  const draftContent = {
        chain: chain.id,
        address_id: author.id,
        title,
        body,
        topic,
      };

  const draft = await models.DiscussionDraft.create(draftContent);

  // TODO: attachments can likely be handled like topics & mentions (see lines 11-14)
  if (
    req.body['attachments[]'] &&
    typeof req.body['attachments[]'] === 'string'
  ) {
    await models.Attachment.create({
      attachable: 'draft',
      attachment_id: draft.id,
      url: req.body['attachments[]'],
      description: 'image',
    });
  } else if (req.body['attachments[]']) {
    await Promise.all(
      req.body['attachments[]'].map((u) =>
        models.Attachment.create({
          attachable: 'draft',
          attachment_id: draft.id,
          url: u,
          description: 'image',
        })
      )
    );
  }

  let finalDraft;
  try {
    finalDraft = await models.DiscussionDraft.findOne({
      where: { id: draft.id },
      include: [models.Address, models.Attachment],
    });
  } catch (err) {
    return next(err);
  }

  return res.json({ status: 'Success', result: finalDraft.toJSON() });
};

export default createDraft;
