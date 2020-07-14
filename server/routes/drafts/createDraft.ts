import { Request, Response, NextFunction } from 'express';

import lookupCommunityIsVisibleToUser from '../../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../../util/lookupAddressIsOwnedByUser';
import { factory, formatFilename } from '../../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InsufficientData: 'Drafts must include title, body, or attachment',
};

const createDraft = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { title, body, tag } = req.body;

  if (!title && !body && !req.body['attachments[]']?.length) {
    return next(new Error(Errors.InsufficientData));
  }

  const draftContent = community ? {
    community: community.id,
    address_id: author.id,
    title,
    body,
    tag
  } : {
    chain: chain.id,
    address_id: author.id,
    title,
    body,
    tag
  };

  const draft = await models.DiscussionDraft.create(draftContent);

  // TODO: attachments can likely be handled like tags & mentions (see lines 11-14)
  if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
    await models.OffchainAttachment.create({
      attachable: 'draft',
      attachment_id: draft.id,
      url: req.body['attachments[]'],
      description: 'image',
    });
  } else if (req.body['attachments[]']) {
    await Promise.all(req.body['attachments[]'].map((u) => models.OffchainAttachment.create({
      attachable: 'draft',
      attachment_id: draft.id,
      url: u,
      description: 'image',
    })));
  }

  let finalDraft;
  try {
    finalDraft = await models.DiscussionDraft.findOne({
      where: { id: draft.id },
      include: [
        models.Address,
        models.OffchainAttachment,
      ],
    });
  } catch (err) {
    return next(err);
  }

  return res.json({ status: 'Success', result: finalDraft.toJSON() });
};

export default createDraft;
