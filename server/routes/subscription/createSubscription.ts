import { Request, Response, NextFunction } from 'express';
import proposalIdToEntity from '../../util/proposalIdToEntity';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.category || req.body.chain_name === undefined
    || req.body.event_name === undefined) {
    return next(new Error(Errors.NoCategoryChainNameAndEventName));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category }
  });
  if (!category) {
    return next(new Error(Errors.InvalidNotificationCategory));
  }

  let obj;
  //
  const p_id = req.body.event_name;
  const p_entity = req.body.chain_name;
  let chain;

  switch (category.name) {
    case 'new-thread-creation': {
      chain = await models.Chain.findOne({
        where: {
          id: req.body.chain_name,
        }
      });
      if (chain) {
        obj = { chain_id: req.body.chain_name };
      } else {
        const community = await models.OffchainCommunity.findOne({
          where: {
            id: req.body.chain_name,
          }
        });
        if (community) obj = { community_id: req.body.chain_name };
      }
      break;
    }
    case 'new-comment-creation':
    case 'new-reaction': {
      if (req.body.chain_name === 'discussion') {
        const thread = await models.OffchainThread.findOne({ where: { id: Number(req.body.event_name), } });
        if (!thread) return next(new Error(Errors.NoThread));
        if (thread.community) {
          obj = { offchain_thread_id: Number(req.body.event_name), community_id: thread.community, };
        } else if (thread.chain) {
          obj = { offchain_thread_id: Number(req.body.event_name), chain_id: thread.chain, };
        }
      } else if (req.body.chain_name === 'comment') {
        const comment = await models.OffchainComment.findOne({ where: { id: Number(req.body.event_name), } });
        if (!comment) return next(new Error(Errors.NoComment));
        if (comment.chain) {
          obj = { offchain_comment_id: Number(req.body.event_name), chain_id: comment.chain, };
        } else if (comment.community) {
          obj = { offchain_comment_id: Number(req.body.event_name), community_id: comment.community, };
        }
      } else {
        if (!req.body.chain_id) return next(new Error(Errors.ChainRequiredForEntity));
        const chainEntity = await proposalIdToEntity(models, req.body.chain_id, `${req.body.chain_name}-${req.body.event_name}`);
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
          id: `${req.body.chain_name}-${req.body.event_name}`,
        }
      });
      if (!chainEventType) {
        // Check to see if it's ERC20 transfer

        if (req.body.category === 'chain-event'
          && req.body.event_name === 'transfer') {
          const node = await models.Chain.findOne({ chain: req.body.chain_name, type: 'token' });

          if (node) {
            await models.ChainEventType.create({
              id: `${req.body.event_name}-${req.body.chain_name}`,
              chain: req.body.chain_name,
              event_name: 'transfer'
            });
          } else {
            return next(new Error(Errors.InvalidChainEventId));
          }
        } else {
          return next(new Error(Errors.InvalidChainEventId));
        }
      }
      obj = { chain_id: p_entity, chain_event_type_id: `${req.body.chain_name}-${req.body.event_name}` };
      break;
    }
    default:
      return next(new Error(Errors.InvalidNotificationCategory));
  }
  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: req.body.category,
    object_id: `${req.body.chain_name}-${req.body.event_name}`,
    is_active: !!req.body.is_active,
    ...obj,
  });

  return res.json({ status: 'Success', result: subscription.toJSON() });
};
