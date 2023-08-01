import { AppError } from 'common-common/src/errors';

import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  InsufficientData: 'Drafts must include title, body, or attachment',
};

const createDraft = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  const { title, body, topic } = req.body;

  const author = req.address;

  if (!title && !body) {
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

  let finalDraft;
  try {
    finalDraft = await models.DiscussionDraft.findOne({
      where: { id: draft.id },
      include: [models.Address],
    });
  } catch (err) {
    return next(err);
  }

  return res.json({ status: 'Success', result: finalDraft.toJSON() });
};

export default createDraft;
