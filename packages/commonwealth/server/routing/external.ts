import {
  DeleteReq,
  OnlyErrorResp,
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
import { validationResult } from 'express-validator';
import Router from 'express/lib/router/index';
import passport from 'passport';
import { Op } from 'sequelize';
import { TokenBalanceCache } from 'token-balance-cache/src';
import { ModelStatic } from '../models/types';
import { putCommunities, putCommunitiesValidation } from '../routes/communities/putCommunities';
import { getBalanceProviders, getBalanceProvidersValidation } from '../routes/getBalanceProviders';
import { getChainNodes, getChainNodesValidation } from '../routes/getChainNodes';
import { getTokenBalance, getTokenBalanceValidation } from '../routes/getTokenBalance';
import { getRoles, getRolesValidation } from '../routes/roles/getRoles';
import { getRules, getRulesValidation } from '../routes/rulesext/getRules';
import { getTopics, getTopicsValidation } from '../routes/topics/getTopics';
import { failure, success, TypedRequest, TypedResponse } from '../types';
import {
  onlyIds,
  postProfilesValidation,
  postReactionsValidation,
  postRolesValidation,
  postRulesValidation,
  postTopicsValidation,
  putCommentsValidation,
} from '../util/helperValidations';
import { filterAddressOwnedByUser } from '../util/lookupAddressIsOwnedByUser';

const deleteEntities = async (
  models: DB,
  model: ModelStatic<any>,
  req: TypedRequest<DeleteReq>,
  res: TypedResponse<OnlyErrorResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const where = { id: { [Op.in]: req.body.ids } };

  const entities = await model.findAll({ where });

  const addresses = await filterAddressOwnedByUser(
    models,
    req.user.id,
    entities.map(e => e.chain),
    [],
    entities.map(e => e.address_id)
  );

  if (addresses.unowned.length !== 0) {
    return failure(res, {
      error: {
        message: 'Some entities to delete were not owned by the user.',
        unownedAddresses: addresses.unowned
      }
    });
  }

  let error = '';
  try {
    await model.destroy({ where });
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

  const addresses = await filterAddressOwnedByUser(
    models,
    req.user.id,
    entityCopy.map(e => e.community_id),
    entityCopy.map(e => e.address),
    entityCopy.map(e => e.address_id)
  );

  if (addresses.unowned.length !== 0) {
    return failure(res, {
      error: {
        message: 'Some addresses provided were not owned by the user.',
        unownedAddresses: addresses.unowned
      }
    });
  }

  const addressMap = addresses.owned.reduce((map, obj) => {
    map[obj.address] = obj.id;
    return map;
  });

  entityCopy.forEach(c => {
    c[chainIdFieldName] = c['community_id'];
    delete c['community_id'];

    // all the entities use the address_id field. If user passed in address, map it to address_id
    if(c.address) {
      c.id = addressMap[c.address];
      delete c['address']
    }
  });

  let error = '';
  try {
    await bulkCreate(entityCopy);
  } catch (e) {
    error = e.name + JSON.stringify(e.fields);
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
  router.put('/comments', passport.authenticate('jwt', { session: false }), putCommentsValidation, addEntities.bind(this, 'chain', models,
    (a) => models.Comment.bulkCreate(a), (req: TypedRequest<PutCommentsReq>) => req.body.comments));
  router.delete('/comments', passport.authenticate('jwt', { session: false }), onlyIds, deleteEntities.bind(this, models, models.Comment));

  router.get('/reactions', getReactionsValidation, getReactions.bind(this, models));
  router.post('/reactions', passport.authenticate('jwt', { session: false }),
    postReactionsValidation, addEntities.bind(this, 'chain', models,
      (a) => models.Reaction.bulkCreate(a), (req: TypedRequest<PostReactionsReq>) => req.body.reactions));
  router.delete('/reactions', passport.authenticate('jwt', { session: false }), onlyIds, deleteEntities.bind(this, models, (a) => models.Reaction));

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
  router.post('/roles', passport.authenticate('jwt', { session: false }), postRolesValidation,
    addEntities.bind(this, 'chain_id', models, (a) => models.Role.bulkCreate(a), (req: TypedRequest<PostRolesReq>) => req.body.roles));
  router.delete('/roles', passport.authenticate('jwt', { session: false }), onlyIds, deleteEntities.bind(this, models, (a) => models.Role.destroy(a)));

  router.get('/rules', getRulesValidation, getRules.bind(this, models));
  router.post('/rules', postRulesValidation, addEntities.bind(this, 'chain_id', models,
    (a) => models.Rule.bulkCreate(a), (req: TypedRequest<PostRulesReq>) => req.body.rules));

  router.get('/chainNodes', getChainNodesValidation, getChainNodes.bind(this, models, tokenBalanceCache));
  router.get('/balanceProviders', getBalanceProvidersValidation,
    getBalanceProviders.bind(this, models, tokenBalanceCache));
  router.get('/tokenBalance', getTokenBalanceValidation, getTokenBalance.bind(this, models, tokenBalanceCache));

  return router;
}