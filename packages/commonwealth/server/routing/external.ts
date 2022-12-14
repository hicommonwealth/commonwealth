import { Express } from 'express';
import Router from 'express/lib/router/index';
import { getThreads, getThreadsValidation } from 'commonwealth/server/routes/threads/getThreads';
import { getCommentsValidation, getComments } from 'commonwealth/server/routes/comments/getComments';
import getReactions, { getReactionsValidation } from 'commonwealth/server/routes/reactions/getReactions';
import getCommunities, { getCommunitiesValidation } from 'commonwealth/server/routes/communities/getCommunities';
import getProfiles, { getProfilesValidation } from 'commonwealth/server/routes/profiles/getProfiles';
import { DB } from 'commonwealth/server/models';
import { TokenBalanceCache } from 'token-balance-cache/src';
import { getChainNodes, getChainNodesValidation } from '../routes/getChainNodes';
import { getBalanceProviders, getBalanceProvidersValidation } from '../routes/getBalanceProviders';
import { getTokenBalance, getTokenBalanceValidation } from '../routes/getTokenBalance';

// contains external routes
export function addExternalRoutes(
  router: Router,
  app: Express,
  models: DB,
  tokenBalanceCache: TokenBalanceCache
): Router {
  router.get('/threads', getThreadsValidation, getThreads.bind(this, models));
  router.get('/comments', getCommentsValidation, getComments.bind(this, models));
  router.get('/reactions', getReactionsValidation, getReactions.bind(this, models));
  router.get('/communities', getCommunitiesValidation, getCommunities.bind(this, models));
  router.get('/profiles', getProfilesValidation, getProfiles.bind(this, models));

  router.get('/chainNodes', getChainNodesValidation, getChainNodes.bind(this, models, tokenBalanceCache));
  router.get('/balanceProviders', getBalanceProvidersValidation, getBalanceProviders.bind(this, models, tokenBalanceCache));
  router.get('/tokenBalance', getTokenBalanceValidation, getTokenBalance.bind(this, models, tokenBalanceCache));

  return router;
}

