import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import moment from 'moment';
import { renderQuillDeltaToText } from '../../shared/utils';
import { NotificationCategories, ProposalType } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoBodyOrAttachment: 'Must provide body or attachment',
  IncorrectOwner: 'Not owned by this user',
};

const editThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { body, title, kind, thread_id } = req.body;

  if (!thread_id) {
    return next(new Error(Errors.NoThreadId));
  }
  if (kind === 'forum') {
    if ((!body || !body.trim()) && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error(Errors.NoBodyOrAttachment));
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

  let thread;
  const userOwnedAddresses = await req.user.getAddresses();
  const userOwnedAddressIds = userOwnedAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id);
  const collaboration = await models.Collaboration.findOne({
    where: {
      offchain_thread_id: thread_id,
      address_id: { [Op.in]: userOwnedAddressIds }
    }
  });
  if (collaboration) {
    thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id
      }
    });
  } else {
    thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
  }
  if (!thread) return next(new Error('No thread with that id found'));
  try {
    // If new comment body text has been submitted, create another version history entry
    if (decodeURIComponent(req.body.body) !== JSON.parse(thread.version_history[0])) {
      console.log('new history entry');
      const recentEdit : any = {
        timestamp: moment(),
        author: req.body.author,
        body: decodeURIComponent(req.body.body)
      };
      const versionHistory : string = JSON.stringify(recentEdit);
      const arr = thread.version_history;
      arr.unshift(versionHistory);
      thread.version_history = arr;
    }
    thread.body = body;
    thread.plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
      } catch (e) {
        return decodeURIComponent(body);
      }
    })();
    if (title) {
      thread.title = title;
    }
    await thread.save();
    await attachFiles();
    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [
        { model: models.Address, as: 'Address' },
        {
          model: models.Address,
          through: models.Collaboration,
          as: 'collaborators'
        },
        models.OffchainAttachment,
        { model: models.OffchainTopic, as: 'topic' },
      ],
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
        chain_id: finalThread.chain,
        community_id: finalThread.community,
        author_address: finalThread.Address.address
      },
      // don't send webhook notifications for edits
      null,
      req.wss,
      [ userOwnedAddresses[0].address ],
    );
    // TODO: dispatch notifications for new mention(s)
    // TODO: update author.last_active

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default editThread;
