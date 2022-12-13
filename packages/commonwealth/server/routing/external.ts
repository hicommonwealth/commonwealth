import express, { Express } from 'express';
import Router from 'express/lib/router/index';
import { getThreads, getThreadsValidation } from 'commonwealth/server/routes/threads/getThreads';
import { getCommentsValidation, getComments } from 'commonwealth/server/routes/comments/getComments';
import getReactions, { getReactionsValidation } from 'commonwealth/server/routes/reactions/getReactions';
import getCommunities, { getCommunitiesValidation } from 'commonwealth/server/routes/communities/getCommunities';
import getProfile from 'commonwealth/server/routes/profiles/getProfile';
import getProfiles from 'commonwealth/server/routes/profiles/getProfiles';
import { DB } from 'commonwealth/server/models';
import { getChainNodes } from '../routes/getChainNodes';
import { getBalanceProviders } from '../routes/getBalanceProviders';
import { getTokenBalance } from '../routes/getTokenBalance';
import { TokenBalanceCache } from 'token-balance-cache/src';

// contains external routes
export function addExternalRoutes(router: Router, app: Express, models: DB, tokenBalanceCache: TokenBalanceCache): Router {
  router.get('/threads', ...getThreadsValidation, getThreads.bind(this, models));
  router.get('/comments', ...getCommentsValidation, getComments.bind(this, models));
  router.get('/reactions', ...getReactionsValidation, getReactions.bind(this, models));
  router.get('/communities', ...getCommunitiesValidation, getCommunities.bind(this, models));
  router.get('/profile', getProfile.bind(this, models));
  router.get('/profiles', getProfiles.bind(this, models));

  router.get('/chainNodes', getChainNodes.bind(this, models));
  router.get('/balanceProviders ', getBalanceProviders.bind(this, tokenBalanceCache, models));
  router.get('/tokenBalance ', getTokenBalance.bind(this, tokenBalanceCache, models));

  return router;
}

