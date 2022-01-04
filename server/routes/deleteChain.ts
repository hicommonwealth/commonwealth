import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete a chain with registered addresses',
  NotAcceptableAdmin: 'Not an Acceptable Admin'
};

const deleteChain = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NeedChainId));
  }
  if (!['george@commonwealth.im', 'zak@commonwealth.im', 'jake@commonwealth.im'].includes(req.user.email)) {
    return next(new Error(Errors.NotAcceptableAdmin));
  }

  const chain = await models.Chain.findOne({
    where: {
      id: req.body.id,
    }
  });
  if (!chain) {
    return next(new Error(Errors.NoChain));
  }

  // delete all nodes first
  const chainNodes = await chain.getChainNodes();

  const chainEntities = await models.ChainEntity.findAll({
    where: {
      chain: chain.id,
    },
    include: [ models.ChainEvents ],
  });

  const addresses = await chain.getAddresses();

  const threads = await chain.getOffchainThreads();

  const comments = await chain.getOffchainComments();

  const reactions = await chain.getOffchainReactions();

  const topics = await chain.getTopics();
  await Promise.all(topics.map((n) => n.destroy()));

  const roles = await models.Roles.findAll({
    where: {
      chain_id: chain.id,
    }
  });

  const inviteCodes = await models.InviteCode.findAll({
    where: {
      chain_id: chain.id,
    }
  });

  const inviteLinks = await models.InviteLink.findAll({
    where: {
      chain_id: chain.id,
    }
  });

  const subscriptions = await models.Subscription.findAll({
    where: {
      chain_id: chain.id,
    }
  });

  const webhooks = await models.Webhook.findAll({
    where: {
      chain_id: chain.id,
    }
  });

  const starredCommunities = await models.StarredCommunity.findAll({
    where: {
      chain: chain.id,
    }
  });


  await Promise.all(starredCommunities.map((n) => n.destroy()));

  await Promise.all(reactions.map((n) => n.destroy()));
  await Promise.all(comments.map((n) => n.destroy()));
  await Promise.all(threads.map((n) => n.destroy()));

  await Promise.all(inviteCodes.map((n) => n.destroy()));
  await Promise.all(inviteLinks.map((n) => n.destroy()));

  await Promise.all(chainEntities.map((n) => n.destroy()));

  await Promise.all(subscriptions.map((n) => n.destroy()));
  await Promise.all(webhooks.map((n) => n.destroy()));

  await Promise.all(roles.map((n) => n.destroy()));
  await Promise.all(addresses.map((n) => n.destroy()));

  await Promise.all(chainNodes.map((n) => n.destroy()));
  await chain.destroy();

  return res.json({ status: 'Success', result: 'Deleted chain' });
};

export default deleteChain;
