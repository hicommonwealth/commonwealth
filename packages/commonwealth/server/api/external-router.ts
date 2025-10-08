import { trpc } from '@hicommonwealth/adapters';
import {
  Comment,
  Community,
  Contest,
  Feed,
  Poll,
  Thread,
  Token,
  User,
} from '@hicommonwealth/model';
import cors from 'cors';
import { Router } from 'express';
import { readFileSync } from 'fs';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import * as bot from './bot';
import * as comment from './comment';
import * as community from './community';
import * as contest from './contest';
import {
  addRateLimiterMiddleware,
  apiKeyAuthMiddleware,
} from './external-router-middleware';
import * as launchpad from './launchpadToken';
import * as poll from './poll';
import * as thread from './thread';
import * as user from './user';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// trigger redeploy
const {
  createCommunity,
  updateCommunity,
  createTopic,
  updateTopic,
  toggleArchiveTopic,
  createGroup,
  updateGroup,
  deleteGroup,
  joinCommunity,
  banAddress,
  updateRole,
} = community.trpcRouter;
const {
  createThread,
  updateThread,
  createThreadReaction,
  deleteReaction,
  deleteThread,
  addLinks,
  deleteLinks,
  createThreadToken,
  createThreadTokenTrade,
} = thread.trpcRouter;
const {
  createComment,
  updateComment,
  deleteComment,
  createCommentReaction,
  toggleCommentSpam,
} = comment.trpcRouter;
const { getNewContent } = user.trpcRouter;
const {
  createContestMetadata,
  updateContestMetadata,
  cancelContestMetadata,
  deleteContestMetadata,
} = contest.trpcRouter;
const { createToken, createTrade, getLaunchpadTrades, getTokenInfoAlchemy } =
  launchpad.trpcRouter;
const { launchTokenBot } = bot.trpcRouter;
const { createPoll, deletePoll, createPollVote } = poll.trpcRouter;

const api = {
  getGlobalActivity: trpc.query(Feed.GetGlobalActivity, trpc.Tag.User, {
    forceSecure: true,
    ttlSecs: config.NO_GLOBAL_ACTIVITY_CACHE ? undefined : 60 * 5,
  }),
  getUserActivity: trpc.query(Feed.GetUserActivity, trpc.Tag.User, {
    forceSecure: true,
  }),
  getUser: trpc.query(User.GetUser, trpc.Tag.User, {
    forceSecure: true,
  }),
  getNewContent,
  getCommunities: trpc.query(Community.GetCommunities, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getCommunity: trpc.query(Community.GetCommunity, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getMembers: trpc.query(Community.GetMembers, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getComments: trpc.query(Comment.GetComments, trpc.Tag.Comment, {
    forceSecure: true,
  }),
  getTopics: trpc.query(Community.GetTopics, trpc.Tag.Community, {
    forceSecure: true,
  }),
  getThreads: trpc.query(Thread.GetThreads, trpc.Tag.Thread, {
    forceSecure: true,
  }),
  getLinks: trpc.query(Thread.GetLinks, trpc.Tag.Thread, {
    forceSecure: true,
  }),
  getAllContests: trpc.query(Contest.GetAllContests, trpc.Tag.Contest, {
    forceSecure: true,
  }),
  getTokens: trpc.query(Token.GetLaunchpadTokens, trpc.Tag.Token, {
    forceSecure: true,
  }),
  createContestMetadata,
  updateContestMetadata,
  cancelContestMetadata,
  deleteContestMetadata,
  createCommunity,
  updateCommunity,
  createTopic,
  updateTopic,
  toggleArchiveTopic,
  createGroup,
  updateGroup,
  deleteGroup,
  createThread,
  updateThread,
  deleteThread,
  addLinks,
  deleteLinks,
  createThreadToken,
  createThreadTokenTrade,
  getThreadTokenHolders: trpc.query(
    Thread.GetThreadTokenHolders,
    trpc.Tag.Thread,
    { forceSecure: true },
  ),
  createComment,
  updateComment,
  deleteComment,
  createThreadReaction,
  createCommentReaction,
  deleteReaction,
  joinCommunity,
  banAddress,
  updateRole,
  toggleCommentSpam,
  createToken,
  createTrade,
  getTokenInfoAlchemy,
  getLaunchpadTrades,
  launchTokenBot,
  createPoll,
  deletePoll,
  createPollVote,
  getPolls: trpc.query(Poll.GetPolls, trpc.Tag.Poll, { forceSecure: true }),
  getPollVotes: trpc.query(Poll.GetPollVotes, trpc.Tag.Poll, {
    forceSecure: true,
  }),
};

const PATH = '/api/v1';
const router = Router();
router.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'api-key', 'address'],
  }),
);

// ===============================================================================
/**
 * TODO: Fix and check integration tests
 * Hack router until we figure out why the integration test server fails to authenticate
 * Found when calling createThread in test/util/modelUtils.ts
 * .post('/api/v1/CreateThread')
 */
if (config.NODE_ENV === 'test')
  router.use(passport.authenticate('jwt', { session: false }));

// ===============================================================================
// eslint-disable-next-line @typescript-eslint/no-misused-promises
if (config.NODE_ENV !== 'test') router.use(apiKeyAuthMiddleware);

if (config.NODE_ENV !== 'test' && config.CACHE.REDIS_URL) {
  addRateLimiterMiddleware();
}

const externalApiConfig = JSON.parse(
  readFileSync(path.join(__dirname, '../external-api-config.json'), 'utf8'),
);

const oasOptions: trpc.OasOptions = {
  title: 'Common API',
  path: PATH,
  version: externalApiConfig.version,
  securityScheme: 'apiKey',
};

const trpcRouter = trpc.router(api);
trpc.useOAS(router, trpcRouter, oasOptions);

export { api, oasOptions, PATH, router, trpcRouter };
