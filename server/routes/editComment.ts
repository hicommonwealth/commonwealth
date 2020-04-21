import { Response, NextFunction } from 'express';
import { NotificationCategories } from '../../shared/types';
import { UserRequest } from '../types';
import { createCommonwealthUrl } from '../util/routeUtils';

const editComment = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const { body, id, child, version_history } = req.body;
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!id) {
    return next(new Error('Must provide id'));
  }

  const attachFiles = async () => {
    if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
      await models.OffchainAttachment.create({
        attachable: 'comment',
        attachment_id: id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(req.body['attachments[]'].map((u) => models.OffchainAttachment.create({
        attachable: 'comment',
        attachment_id: id,
        url: u,
        description: 'image',
      })));
    }
  };

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const comment = await models.OffchainComment.findOne({
      where: { id },
    });

    if (userOwnedAddresses.map((addr) => addr.id).indexOf(comment.address_id) === -1) {
      return next(new Error('Not owned by this user'));
    }
    const arr = comment.version_history;
    arr.unshift(version_history);
    comment.version_history = arr;
    comment.text = body;
    await comment.save();
    attachFiles();
    const finalComment = await models.OffchainComment.findOne({
      where: { id: comment.id },
      include: [models.Address, models.OffchainAttachment],
    });
    // get thread for crafting commonwealth url
    const thread = await models.OffchainThread.findOne({ where: { id: finalComment.root_id.split('_')[1] } });
    // dispatch notifications to subscribers of the comment/thread
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.CommentEdit,
      '',
      {
        created_at: new Date(),
        comment_id: finalComment.id,
        author_address: finalComment.Address.address
      },
      // don't send webhook notifications for edits
      {
        user: finalComment.Address.address,
        url: createCommonwealthUrl(thread, finalComment),
        title: thread.title,
        chain: finalComment.chain,
        community: finalComment.community,
      },
      req.wss,
      [ finalComment.Address.address ],
    );

    return res.json({ status: 'Success', result: finalComment.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editComment;
