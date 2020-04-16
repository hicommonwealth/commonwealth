import { NotificationCategories, ProposalType } from '../../shared/types';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import lookupCommunityIsVisibleToUser from 'server/util/lookupCommunityIsVisibleToUser';

const editThread = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);

  const { body, kind, thread_id, version_history } = req.body;

  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!thread_id) {
    return next(new Error('Must provide thread_id'));
  }

  if (kind === 'forum') {
    if ((!body || !body.trim()) && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error('Forum posts must include body or attachment'));
    }
  }
  const attachFiles = async () => {
    if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
      await models.OffchainAttachment.create({
        attachable: 'thread',
        attachment_id: thread_id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
        attachable: 'thread',
        attachment_id: thread_id,
        url,
        description: 'image',
      })));
    }
  };

  try {
    const userOwnedAddresses = await req.user.getAddresses();
    const thread = await models.OffchainThread.findOne({
      where: { id: thread_id },
    });
    if (userOwnedAddresses.map((addr) => addr.id).indexOf(thread.author_id) === -1) {
      return next(new Error('Not owned by this user'));
    }
    const arr = thread.version_history;
    arr.unshift(version_history);
    thread.version_history = arr;
    thread.body = body;
    await thread.save();
    attachFiles();
    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTag, as: 'tags' } ],
    });

    // dispatch notifications to subscribers of the given chain/community
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.ThreadEdit,
      '',
      {
        created_at: new Date(),
        root_id: Number(finalThread.id),
        root_type: ProposalType.OffchainThread,
        root_title: finalThread.title,
        chain_id: chain.id,
        community_id: community.id,
        author_address: finalThread.Address.address
      },
      // don't send webhook notifications for edits
      null,
      req.wss,
    );
    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editThread;
