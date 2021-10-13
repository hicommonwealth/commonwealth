import { Request, Response, NextFunction } from 'express';
import proposalIdToEntity from '../../util/proposalIdToEntity';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.category || req.body.object_id === undefined) {
    return next(new Error(Errors.NoCategoryAndObjectId));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category }
  });
  if (!category) {
    return next(new Error(Errors.InvalidNotificationCategory));
  }

  const p_entity = req.body.object_id.substr(0, req.body.object_id.lastIndexOf('-'));
  const p_id = req.body.object_id.substr(req.body.object_id.lastIndexOf('-') + 1);

  let obj;
  let chain;

  switch (category.name) {
    case 'new-thread-creation': {
      chain = await models.Chain.findOne({
        where: {
          id: p_entity,
        }
      });
      if (chain) {
        obj = { chain_id: p_entity };
      } else {
        const community = await models.OffchainCommunity.findOne({
          where: {
            id: p_entity,
          }
        });
        if (community) obj = { community_id: p_entity };
      }
      break;
    }
    case 'new-comment-creation':
    case 'new-reaction': {
      if (p_entity === 'discussion') {
        const thread = await models.OffchainThread.findOne({ where: { id: Number(p_id), } });
        if (!thread) return next(new Error(Errors.NoThread));
        if (thread.community) {
          obj = { offchain_thread_id: Number(p_id), community_id: thread.community, };
        } else if (thread.chain) {
          obj = { offchain_thread_id: Number(p_id), chain_id: thread.chain, };
        }
      } else if (p_entity === 'comment') {
        const comment = await models.OffchainComment.findOne({ where: { id: Number(p_id), } });
        if (!comment) return next(new Error(Errors.NoComment));
        if (comment.chain) {
          obj = { offchain_comment_id: Number(p_id), chain_id: comment.chain, };
        } else if (comment.community) {
          obj = { offchain_comment_id: Number(p_id), community_id: comment.community, };
        }
      } else {
        if (!req.body.chain_id) return next(new Error(Errors.ChainRequiredForEntity));
        const chainEntity = await proposalIdToEntity(models, req.body.chain_id, req.body.object_id);
        if (!chainEntity) return next(new Error(Errors.NoChainEntity));
        obj = { chain_id: chainEntity.chain, chain_entity_id: chainEntity.id, };
      }
      break;
    }
    case 'new-mention':
      return next(new Error(Errors.NoMentions));
    case 'chain-event': {
      chain = await models.Chain.findOne({
        where: {
          id: p_entity,
        }
      });
      if (!chain) return next(new Error(Errors.InvalidChain));
      const chainEventType = await models.ChainEventType.findOne({
        where: {
          id: req.body.object_id,
        }
      });
      // TODO: this is not great -- ideally we should not be creating ChainEventTypes in the middle
      //   of creating Subscriptions, as theoretically ChainEventTypes are what describe the available
      //   set of subscriptions... but this entire set of database models needs to be reworked, so this
      //   is an acceptable hack for now.
      if (!chainEventType && chain.type === 'token' && (p_id === 'transfer' || p_id === 'approval')) {
        await models.ChainEventType.create({
          id: req.body.object_id,
          chain: req.body.chain_id,
          event_name: p_id
        });
      } else {
        return next(new Error(Errors.InvalidChainEventId));
      }
      obj = { chain_id: p_entity, chain_event_type_id: req.body.event_name };
      break;
    }
    default:
      return next(new Error(Errors.InvalidNotificationCategory));
  }
  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: req.body.category,
    object_id: req.body.object_id,
    is_active: !!req.body.is_active,
    ...obj,
  });

  return res.json({ status: 'Success', result: subscription.toJSON() });
};
