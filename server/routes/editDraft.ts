/* eslint-disable no-restricted-syntax */
import { Request, Response, NextFunction } from 'express';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { factory, formatFilename } from '../../shared/logging';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoId: 'Must supply draft ID.',
  NotOwner: 'User does not have permission to edit this thread.',
  NotFound: 'Draft not found.'
};

const editDraft = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  if (!req.body.id) {
    return next(new Error(Errors.NoId));
  }

  const { id, title, body, tag } = req.body;

  const attachFiles = async () => {
    if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
      await models.OffchainAttachment.create({
        attachable: 'draft',
        attachment_id: id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
        attachable: 'draft',
        attachment_id: id,
        url,
        description: 'image',
      })));
    }
  };

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const draft = await models.DiscussionDraft.findOne({
      where: { id },
    });
    if (!draft) return next(new Error(Errors.NotFound));
    if (userOwnedAddresses.filter((addr) => addr.verified).map((addr) => addr.id).indexOf(draft.author_id) === -1) {
      return next(new Error(Errors.NotOwner));
    }
    if (body) draft.body = body;
    if (title) draft.title = title;
    if (tag) draft.tag = tag;
    await tag.save();
    attachFiles();

    return res.json({ status: 'Success', result: tag.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editDraft;
