import {
  PostProfilesReq,
  PostReactionsReq,
  PostRolesReq,
  PostRulesReq,
  PostTopicsReq,
  PutCommentsReq
} from 'common-common/src/api/extApiTypes';
import { DB } from 'commonwealth/server/models';
import { getComments, getCommentsValidation } from 'commonwealth/server/routes/comments/getComments';
import getCommunities, { getCommunitiesValidation } from 'commonwealth/server/routes/communities/getCommunities';
import getProfiles, { getProfilesValidation } from 'commonwealth/server/routes/profiles/getProfiles';
import getReactions, { getReactionsValidation } from 'commonwealth/server/routes/reactions/getReactions';
import { getThreads, getThreadsValidation } from 'commonwealth/server/routes/threads/getThreads';
import { Express } from 'express';
import Router from 'express/lib/router/index';
import passport from 'passport';
import { TokenBalanceCache } from 'token-balance-cache/src';
import { addEntities } from '../routes/addEntities';
import { putCommunities, putCommunitiesValidation } from '../routes/communities/putCommunities';
import { deleteEntities } from '../routes/deleteEntities';
import { getBalanceProviders, getBalanceProvidersValidation } from '../routes/getBalanceProviders';
import { getChainNodes, getChainNodesValidation } from '../routes/getChainNodes';
import { getTokenBalance, getTokenBalanceValidation } from '../routes/getTokenBalance';
import { getRoles, getRolesValidation } from '../routes/roles/getRoles';
import { getRules, getRulesValidation } from '../routes/rulesext/getRules';
import { getTopics, getTopicsValidation } from '../routes/topics/getTopics';
import { TypedRequest } from '../types';
import {
  onlyIds,
  postProfilesValidation,
  postReactionsValidation,
  postRolesValidation,
  postRulesValidation,
  postTopicsValidation,
  putCommentsValidation,
} from '../util/helperValidations';

// contains external routes
export function addExternalRoutes(
  router: Router,
  app: Express,
  models: DB,
  tokenBalanceCache: TokenBalanceCache
): Router {
  router.get('/threads', getThreadsValidation, getThreads.bind(this, models));

  router.get('/comments', getCommentsValidation, getComments.bind(this, models));
  router.put('/comments', passport.authenticate('jwt', { session: false }), putCommentsValidation, addEntities.bind(this, 'chain', models,
    (a) => models.Comment.bulkCreate(a), (req: TypedRequest<PutCommentsReq>) => req.body.comments));
  router.delete('/comments', passport.authenticate('jwt', { session: false }), onlyIds, deleteEntities.bind(this,'chain', models, models.Comment));

  router.get('/reactions', getReactionsValidation, getReactions.bind(this, models));
  router.post('/reactions', passport.authenticate('jwt', { session: false }),
    postReactionsValidation, addEntities.bind(this, 'chain', models,
      (a) => models.Reaction.bulkCreate(a), (req: TypedRequest<PostReactionsReq>) => req.body.reactions));
  router.delete('/reactions', passport.authenticate('jwt', { session: false }), onlyIds, deleteEntities.bind(this,'chain', models, models.Reaction));

  router.get('/communities', getCommunitiesValidation, getCommunities.bind(this, models));
  router.put('/communities', putCommunitiesValidation, putCommunities.bind(this, models, tokenBalanceCache));

  router.get('/profiles', getProfilesValidation, getProfiles.bind(this, models));
  router.post('/profiles', postProfilesValidation, addEntities.bind(this, 'chain', models,
    (a) => models.Profile.bulkCreate(a), (req: TypedRequest<PostProfilesReq>) => req.body.profiles));

  router.get('/topics', getTopicsValidation, getTopics.bind(this, models));
  router.post('/topics', postTopicsValidation, addEntities.bind(this, 'chain_id', models,
    (a) => models.Topic.bulkCreate(a), (req: TypedRequest<PostTopicsReq>) => req.body.topics));
  router.delete('/topics', onlyIds, deleteEntities.bind(this,'chain_id', models, models.Topic));

  router.get('/roles', getRolesValidation, getRoles.bind(this, models));
  router.post('/roles', passport.authenticate('jwt', { session: false }), postRolesValidation,
    addEntities.bind(this, 'chain_id', models, (a) => models.Role.bulkCreate(a), (req: TypedRequest<PostRolesReq>) => req.body.roles));
  router.delete('/roles', passport.authenticate('jwt', { session: false }), onlyIds, deleteEntities.bind(this, 'chain_id', models, models.Role));

  router.get('/rules', getRulesValidation, getRules.bind(this, models));
  router.post('/rules', postRulesValidation, addEntities.bind(this, 'chain_id', models,
    (a) => models.Rule.bulkCreate(a), (req: TypedRequest<PostRulesReq>) => req.body.rules));

  router.get('/chainNodes', getChainNodesValidation, getChainNodes.bind(this, models, tokenBalanceCache));
  router.get('/balanceProviders', getBalanceProvidersValidation,
    getBalanceProviders.bind(this, models, tokenBalanceCache));
  router.get('/tokenBalance', getTokenBalanceValidation, getTokenBalance.bind(this, models, tokenBalanceCache));

  return router;
}