import type { Express } from 'express';
import express from 'express';
import type Router from 'express/lib/router/index';
import passport from 'passport';
import type { TokenBalanceCache } from 'token-balance-cache/src';
import type {
  PostReactionsReq,
  PostTopicsReq,
  PutCommentsReq,
} from '../api/extApiTypes';
import type { DB } from '../models';
import { addEntities } from '../routes/addEntities';
import {
  getComments,
  getCommentsValidation,
} from '../routes/comments/getComments';
import getCommunities, {
  getCommunitiesValidation,
} from '../routes/communities/getCommunities';
import {
  putCommunities,
  putCommunitiesValidation,
} from '../routes/communities/putCommunities';
import { deleteEntities } from '../routes/deleteEntities';
import {
  getBalanceProviders,
  getBalanceProvidersValidation,
} from '../routes/getBalanceProviders';
import {
  getChainNodes,
  getChainNodesValidation,
} from '../routes/getChainNodes';
import {
  getTokenBalance,
  getTokenBalanceValidation,
} from '../routes/getTokenBalance';
import getProfiles, {
  getProfilesValidation,
} from '../routes/profiles/getProfiles';
import getReactions, {
  getReactionsValidation,
} from '../routes/reactions/getReactions';
import { getThreads, getThreadsValidation } from '../routes/threads/getThreads';
import { getTopics, getTopicsValidation } from '../routes/topics/getTopics';
import type { TypedRequest } from '../types';
import {
  onlyIds,
  postReactionsValidation,
  postTopicsValidation,
  putCommentsValidation,
} from '../util/helperValidations';

// contains external routes
export function addExternalRoutes(
  endpoint: string,
  app: Express,
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
): Router {
  const router = express.Router();

  router.get('/threads', getThreadsValidation, getThreads.bind(this, models));

  router.get(
    '/comments',
    getCommentsValidation,
    getComments.bind(this, models),
  );
  router.put(
    '/comments',
    passport.authenticate('jwt', { session: false }),
    putCommentsValidation,
    addEntities.bind(
      this,
      'chain',
      models,
      (a) => models.Comment.bulkCreate(a),
      (req: TypedRequest<PutCommentsReq>) => req.body.comments,
    ),
  );
  router.delete(
    '/comments',
    passport.authenticate('jwt', { session: false }),
    onlyIds,
    deleteEntities.bind(this, 'chain', models, models.Comment),
  );

  router.get(
    '/reactions',
    getReactionsValidation,
    getReactions.bind(this, models),
  );
  router.post(
    '/reactions',
    passport.authenticate('jwt', { session: false }),
    postReactionsValidation,
    addEntities.bind(
      this,
      'chain',
      models,
      (a) => models.Reaction.bulkCreate(a),
      (req: TypedRequest<PostReactionsReq>) => req.body.reactions,
    ),
  );
  router.delete(
    '/reactions',
    passport.authenticate('jwt', { session: false }),
    onlyIds,
    deleteEntities.bind(this, 'chain', models, models.Reaction),
  );

  router.get(
    '/communities',
    getCommunitiesValidation,
    getCommunities.bind(this, models),
  );
  router.put(
    '/communities',
    putCommunitiesValidation,
    putCommunities.bind(this, models, tokenBalanceCache),
  );

  router.get(
    '/profiles',
    getProfilesValidation,
    getProfiles.bind(this, models),
  );

  router.get('/topics', getTopicsValidation, getTopics.bind(this, models));
  router.post(
    '/topics',
    postTopicsValidation,
    addEntities.bind(
      this,
      'community_id',
      models,
      (a) => models.Topic.bulkCreate(a),
      (req: TypedRequest<PostTopicsReq>) => req.body.topics,
    ),
  );
  router.delete(
    '/topics',
    onlyIds,
    deleteEntities.bind(this, 'community_id', models, models.Topic),
  );

  router.get(
    '/chainNodes',
    getChainNodesValidation,
    getChainNodes.bind(this, models, tokenBalanceCache),
  );
  router.get(
    '/balanceProviders',
    getBalanceProvidersValidation,
    getBalanceProviders.bind(this, models, tokenBalanceCache),
  );
  router.get(
    '/tokenBalance',
    getTokenBalanceValidation,
    getTokenBalance.bind(this, models, tokenBalanceCache),
  );

  app.use(endpoint, router);

  return router;
}
