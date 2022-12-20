import { Express } from 'express';
import Router from 'express/lib/router/index';
import { getThreads, getThreadsValidation } from 'commonwealth/server/routes/threads/getThreads';
import { getCommentsValidation, getComments } from 'commonwealth/server/routes/comments/getComments';
import getReactions, { getReactionsValidation } from 'commonwealth/server/routes/reactions/getReactions';
import getCommunities, { getCommunitiesValidation } from 'commonwealth/server/routes/communities/getCommunities';
import getProfiles, { getProfilesValidation } from 'commonwealth/server/routes/profiles/getProfiles';
import { DB } from 'commonwealth/server/models';
import { TokenBalanceCache } from 'token-balance-cache/src';
import {
  DeleteReq,
  OnlyErrorResp, PostProfilesReq,
  PostReactionsReq, PostRolesReq, PostRulesReq, PostTopicsReq,
  PutCommentsReq,
  PutCommunitiesReq
} from "common-common/src/api/extApiTypes";
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import { getChainNodes, getChainNodesValidation } from '../routes/getChainNodes';
import { getBalanceProviders, getBalanceProvidersValidation } from '../routes/getBalanceProviders';
import { getTokenBalance, getTokenBalanceValidation } from '../routes/getTokenBalance';
import {
  onlyIds, postProfilesValidation,
  postReactionsValidation, postRolesValidation, postRulesValidation, postTopicsValidation,
  putCommentsValidation,
} from "../util/helperValidations";
import { failure, success, TypedRequest, TypedResponse } from "../types";
import { getTopics, getTopicsValidation } from "../routes/topics/getTopics";
import { getRoles, getRolesValidation } from "../routes/roles/getRoles";
import { getRules, getRulesValidation } from "../routes/rulesext/getRules";
import { putCommunities, putCommunitiesValidation } from '../routes/communities/putCommunities';

const deleteEntities = async (
  models: DB,
  destroy: (obj) => Promise<number>,
  req: TypedRequest<DeleteReq>,
  res: TypedResponse<OnlyErrorResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const where = { id: { [Op.in]: req.body.ids } };

  let error = '';
  try {
    await destroy({ where });
  } catch (e) {
    error = e.message;
  }
  return success(res, { error });
};

async function addEntities<M extends Record<string, unknown> = Record<string, unknown>>(
  chainIdFieldName: string,
  models: DB,
  bulkCreate: (obj) => Promise<number>,
  entities: (req: TypedRequest<M>) => any,
  req: TypedRequest<M>,
  res: TypedResponse<OnlyErrorResp>
) {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const entityCopy = entities(req);
  entityCopy.forEach(c => {
    c[chainIdFieldName] = c['community_id'];
    delete c['community_id'];
  })

  let error = '';
  try {
    await bulkCreate(entityCopy);
  } catch (e) {
    error = e.message;
  }
  return success(res, { error });
}

// contains external routes
export function addExternalRoutes(
  router: Router,
  app: Express,
  models: DB,
  tokenBalanceCache: TokenBalanceCache
): Router {
  router.get('/threads', getThreadsValidation, getThreads.bind(this, models));

  router.get('/comments', getCommentsValidation, getComments.bind(this, models));
  router.put('/comments', putCommentsValidation, addEntities.bind(this, 'chain', models,
    (a) => models.Comment.bulkCreate(a), (req: TypedRequest<PutCommentsReq>) => req.body.comments));
  router.delete('/comments', onlyIds, deleteEntities.bind(this, models, (a) => models.Comment.destroy(a)));

  router.get('/reactions', getReactionsValidation, getReactions.bind(this, models));
  router.post('/reactions', postReactionsValidation, addEntities.bind(this, 'chain', models,
    (a) => models.Reaction.bulkCreate(a), (req: TypedRequest<PostReactionsReq>) => req.body.reactions));
  router.delete('/reactions', onlyIds, deleteEntities.bind(this, models, (a) => models.Reaction.destroy(a)));

  router.get('/communities', getCommunitiesValidation, getCommunities.bind(this, models));
  router.put('/communities', putCommunitiesValidation, putCommunities.bind(this, models, tokenBalanceCache));

  router.get('/profiles', getProfilesValidation, getProfiles.bind(this, models));
  router.post('/profiles', postProfilesValidation, addEntities.bind(this, 'chain', models,
    (a) => models.Profile.bulkCreate(a), (req: TypedRequest<PostProfilesReq>) => req.body.profiles));

  router.get('/topics', getTopicsValidation, getTopics.bind(this, models));
  router.post('/topics', postTopicsValidation, addEntities.bind(this, 'chain_id', models,
    (a) => models.Topic.bulkCreate(a), (req: TypedRequest<PostTopicsReq>) => req.body.topics));
  router.delete('/topics', onlyIds, deleteEntities.bind(this, models, (a) => models.Topic.destroy(a)));

  router.get('/roles', getRolesValidation, getRoles.bind(this, models));
  router.post('/roles', postRolesValidation, addEntities.bind(this, 'chain_id', models,
    (a) => models.Role.bulkCreate(a), (req: TypedRequest<PostRolesReq>) => req.body.roles));
  router.delete('/roles', onlyIds, deleteEntities.bind(this, models, (a) => models.Role.destroy(a)));

  router.get('/rules', getRulesValidation, getRules.bind(this, models));
  router.post('/rules', postRulesValidation, addEntities.bind(this, 'chain_id', models,
    (a) => models.Rule.bulkCreate(a), (req: TypedRequest<PostRulesReq>) => req.body.rules));

  router.get('/chainNodes', getChainNodesValidation, getChainNodes.bind(this, models, tokenBalanceCache));
  router.get('/balanceProviders', getBalanceProvidersValidation,
    getBalanceProviders.bind(this, models, tokenBalanceCache));
  router.get('/tokenBalance', getTokenBalanceValidation, getTokenBalance.bind(this, models, tokenBalanceCache));

  return router;
}