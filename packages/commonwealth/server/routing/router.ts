import express from 'express';
import passport from 'passport';
import type { Express } from 'express';

import { TokenBalanceCache } from 'token-balance-cache/src';

import domain from 'commonwealth/server/routes/domain';
import status from 'commonwealth/server/routes/status';
import createAddress from 'commonwealth/server/routes/createAddress';
import linkExistingAddressToChain from 'commonwealth/server/routes/linkExistingAddressToChain';
import verifyAddress from 'commonwealth/server/routes/verifyAddress';
import deleteAddress from 'commonwealth/server/routes/deleteAddress';
import getAddressStatus from 'commonwealth/server/routes/getAddressStatus';
import selectChain from 'commonwealth/server/routes/selectChain';
import startEmailLogin from 'commonwealth/server/routes/startEmailLogin';
import finishEmailLogin from 'commonwealth/server/routes/finishEmailLogin';
import finishOAuthLogin from 'commonwealth/server/routes/finishOAuthLogin';
import startOAuthLogin from 'commonwealth/server/routes/startOAuthLogin';
import createComment from 'commonwealth/server/routes/createComment';
import editComment from 'commonwealth/server/routes/editComment';
import deleteComment from 'commonwealth/server/routes/deleteComment';
import viewComments from 'commonwealth/server/routes/viewComments';
import bulkComments from 'commonwealth/server/routes/bulkComments';
import createReaction from 'commonwealth/server/routes/createReaction';
import deleteReaction from 'commonwealth/server/routes/deleteReaction';
import viewReactions from 'commonwealth/server/routes/viewReactions';
import bulkReactions from 'commonwealth/server/routes/bulkReactions';
import reactionsCounts from 'commonwealth/server/routes/reactionsCounts';
import threadsUsersCountAndAvatars from 'commonwealth/server/routes/threadsUsersCountAndAvatars';
import starCommunity from 'commonwealth/server/routes/starCommunity';
import createChain from 'commonwealth/server/routes/createChain';
import createContract from 'commonwealth/server/routes/contracts/createContract';
import viewCount from 'commonwealth/server/routes/viewCount';
import updateEmail from 'commonwealth/server/routes/updateEmail';
import updateBanner from 'commonwealth/server/routes/updateBanner';
import communityStats from 'commonwealth/server/routes/communityStats';

import viewSubscriptions from 'commonwealth/server/routes/subscription/viewSubscriptions';
import createSubscription from 'commonwealth/server/routes/subscription/createSubscription';
import deleteSubscription from 'commonwealth/server/routes/subscription/deleteSubscription';
import enableSubscriptions from 'commonwealth/server/routes/subscription/enableSubscriptions';
import disableSubscriptions from 'commonwealth/server/routes/subscription/disableSubscriptions';
import enableImmediateEmails from 'commonwealth/server/routes/subscription/enableImmediateEmails';
import disableImmediateEmails from 'commonwealth/server/routes/subscription/disableImmediateEmails';
import viewNotifications, {
  NotificationCategories,
} from 'commonwealth/server/routes/viewNotifications';
import viewUserActivity from 'commonwealth/server/routes/viewUserActivity';
import viewChainActivity from 'commonwealth/server/routes/viewChainActivity';
import viewGlobalActivity from 'commonwealth/server/routes/viewGlobalActivity';
import markNotificationsRead from 'commonwealth/server/routes/markNotificationsRead';
import clearReadNotifications from 'commonwealth/server/routes/clearReadNotifications';
import clearNotifications from 'commonwealth/server/routes/clearNotifications';
import bulkMembers from 'commonwealth/server/routes/bulkMembers';
import bulkAddresses from 'commonwealth/server/routes/bulkAddresses';
import createInvite from 'commonwealth/server/routes/createInvite';
import acceptInvite from 'commonwealth/server/routes/acceptInvite';
import addMember from 'commonwealth/server/routes/addMember';
import upgradeMember from 'commonwealth/server/routes/upgradeMember';
import deleteSocialAccount from 'commonwealth/server/routes/deleteSocialAccount';
import getProfileOld from 'commonwealth/server/routes/getProfile';

import createRole from 'commonwealth/server/routes/createRole';
import deleteRole from 'commonwealth/server/routes/deleteRole';
import setDefaultRole from 'commonwealth/server/routes/setDefaultRole';

import getUploadSignature from 'commonwealth/server/routes/getUploadSignature';
import activeThreads from 'commonwealth/server/routes/activeThreads';
import createThread from 'commonwealth/server/routes/createThread';
import editThread from 'commonwealth/server/routes/editThread';
import createPoll from 'commonwealth/server/routes/createPoll';
import getPolls from 'commonwealth/server/routes/getPolls';
import updateThreadStage from 'commonwealth/server/routes/updateThreadStage';
import updateThreadPrivacy from 'commonwealth/server/routes/updateThreadPrivacy';
import updateThreadPinned from 'commonwealth/server/routes/updateThreadPinned';
import updateThreadLinkedChainEntities from 'commonwealth/server/routes/updateThreadLinkedChainEntities';
import updateThreadLinkedSnapshotProposal from 'commonwealth/server/routes/updateThreadLinkedSnapshotProposal';
import updateVote from 'commonwealth/server/routes/updateVote';
import viewVotes from 'commonwealth/server/routes/viewVotes';
import fetchEntityTitle from 'commonwealth/server/routes/fetchEntityTitle';
import fetchThreadForSnapshot from 'commonwealth/server/routes/fetchThreadForSnapshot';
import updateChainEntityTitle from 'commonwealth/server/routes/updateChainEntityTitle';
import updateLinkedThreads from 'commonwealth/server/routes/updateLinkedThreads';
import deleteThread from 'commonwealth/server/routes/deleteThread';
import addEditors from 'commonwealth/server/routes/addEditors';
import deleteEditors from 'commonwealth/server/routes/deleteEditors';
import bulkThreads from 'commonwealth/server/routes/bulkThreads';
import getThreadsOld from 'commonwealth/server/routes/getThreads';
import searchDiscussions from 'commonwealth/server/routes/searchDiscussions';
import searchComments from 'commonwealth/server/routes/searchComments';
import createDraft from 'commonwealth/server/routes/drafts/createDraft';
import deleteDraft from 'commonwealth/server/routes/drafts/deleteDraft';
import editDraft from 'commonwealth/server/routes/drafts/editDraft';
import getDrafts from 'commonwealth/server/routes/drafts/getDrafts';
import deleteChain from 'commonwealth/server/routes/deleteChain';
import updateChain from 'commonwealth/server/routes/updateChain';
import bulkProfiles from 'commonwealth/server/routes/bulkProfiles';
import updateProfile from 'commonwealth/server/routes/updateProfile';
import writeUserSetting from 'commonwealth/server/routes/writeUserSetting';
import sendFeedback from 'commonwealth/server/routes/sendFeedback';
import logout from 'commonwealth/server/routes/logout';
import createTopic from 'commonwealth/server/routes/createTopic';
import updateTopic from 'commonwealth/server/routes/updateTopic';
import orderTopics from 'commonwealth/server/routes/orderTopics';
import editTopic from 'commonwealth/server/routes/editTopic';
import deleteTopic from 'commonwealth/server/routes/deleteTopic';
import bulkTopics from 'commonwealth/server/routes/bulkTopics';
import bulkOffchain from 'commonwealth/server/routes/bulkOffchain';
import setTopicThreshold from 'commonwealth/server/routes/setTopicThreshold';
import getChatMessages from 'commonwealth/server/routes/chat/getChatMessages';
import getChatChannel from 'commonwealth/server/routes/chat/getChatChannel';
import createChatChannel from 'commonwealth/server/routes/chat/createChatChannel';
import deleteChatChannel from 'commonwealth/server/routes/chat/deleteChatChannel';
import deleteChatCategory from 'commonwealth/server/routes/chat/deleteChatCategory';
import editChatChannel from 'commonwealth/server/routes/chat/editChatChannel';
import editChatCategory from 'commonwealth/server/routes/chat/editChatCategory';

import createRule from 'commonwealth/server/routes/rules/createRule';
import deleteRule from 'commonwealth/server/routes/rules/deleteRule';
import getRuleTypes from 'commonwealth/server/routes/rules/getRuleTypes';

import createWebhook from 'commonwealth/server/routes/webhooks/createWebhook';
import updateWebhook from 'commonwealth/server/routes/webhooks/updateWebhook';
import deleteWebhook from 'commonwealth/server/routes/webhooks/deleteWebhook';
import getWebhooks from 'commonwealth/server/routes/webhooks/getWebhooks';
import ViewCountCache from 'commonwealth/server/util/viewCountCache';
import IdentityFetchCache from 'commonwealth/server/util/identityFetchCache';
import updateChainCategory from 'commonwealth/server/routes/updateChainCategory';
import updateChainCustomDomain from 'commonwealth/server/routes/updateChainCustomDomain';
import updateChainPriority from 'commonwealth/server/routes/updateChainPriority';
import migrateEvent from 'commonwealth/server/routes/migrateEvent';

import startSsoLogin from 'commonwealth/server/routes/startSsoLogin';
import finishSsoLogin from 'commonwealth/server/routes/finishSsoLogin';
import bulkEntities from 'commonwealth/server/routes/bulkEntities';
import { getTokensFromLists } from 'commonwealth/server/routes/getTokensFromLists';
import getTokenForum from 'commonwealth/server/routes/getTokenForum';
import tokenBalance from 'commonwealth/server/routes/tokenBalance';
import bulkBalances from 'commonwealth/server/routes/bulkBalances';
import getSupportedEthChains from 'commonwealth/server/routes/getSupportedEthChains';
import editSubstrateSpec from 'commonwealth/server/routes/editSubstrateSpec';
import updateAddress from 'commonwealth/server/routes/updateAddress';
import { DB } from 'commonwealth/server/models';
import { sendMessage } from 'commonwealth/server/routes/snapshotAPI';
import ipfsPin from 'commonwealth/server/routes/ipfsPin';
import setAddressWallet from 'commonwealth/server/routes/setAddressWallet';
import RuleCache from 'commonwealth/server/util/rules/ruleCache';
import banAddress from 'commonwealth/server/routes/banAddress';
import getBannedAddresses from 'commonwealth/server/routes/getBannedAddresses';
import BanCache from 'commonwealth/server/util/banCheckCache';
import authCallback from 'commonwealth/server/routes/authCallback';

import { StatsDController } from 'common-common/src/statsd';
import { addExternalRoutes } from './external';

function setupRouter(
  app: Express,
  models: DB,
  viewCountCache: ViewCountCache,
  identityFetchCache: IdentityFetchCache,
  tokenBalanceCache: TokenBalanceCache,
  ruleCache: RuleCache,
  banCache: BanCache // TODO: where is this needed?
) {
  const router = express.Router();

  router.use((req, res, next) => {
    StatsDController.get().increment('cw.path.called', { path: req.path.slice(1) });
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      StatsDController.get().histogram(
        `cw.path.latency`,
        latency,
        { path: req.path.slice(1) }
      );
    });
    next();
  });

  router.post(
    '/updateAddress',
    passport.authenticate('jwt', { session: false }),
    updateAddress.bind(this, models)
  );
  router.get('/domain', domain.bind(this, models));
  router.get('/status', status.bind(this, models));
  router.post(
    '/ipfsPin',
    passport.authenticate('jwt', { session: false }),
    ipfsPin.bind(this, models)
  );
  router.post(
    '/editSubstrateSpec',
    passport.authenticate('jwt', { session: false }),
    editSubstrateSpec.bind(this, models)
  );

  router.post('/createAddress', createAddress.bind(this, models));
  router.post('/verifyAddress', verifyAddress.bind(this, models));
  router.post(
    '/deleteAddress',
    passport.authenticate('jwt', { session: false }),
    deleteAddress.bind(this, models)
  );
  router.post(
    '/linkExistingAddressToChain',
    passport.authenticate('jwt', { session: false }),
    linkExistingAddressToChain.bind(this, models)
  );
  router.post('/getAddressStatus', getAddressStatus.bind(this, models));
  router.post(
    '/selectChain',
    passport.authenticate('jwt', { session: false }),
    selectChain.bind(this, models)
  );

  // chains
  router.post(
    '/createChain',
    passport.authenticate('jwt', { session: false }),
    createChain.bind(this, models)
  );
  router.post('/deleteChain', deleteChain.bind(this, models));
  router.post(
    '/updateChain',
    passport.authenticate('jwt', { session: false }),
    updateChain.bind(this, models)
  );

  router.post(
    '/createContract',
    passport.authenticate('jwt', { session: false }),
    createContract.bind(this, models)
  );

  router.post(
    '/starCommunity',
    passport.authenticate('jwt', { session: false }),
    starCommunity.bind(this, models)
  );

  router.post(
    '/tokenBalance',
    tokenBalance.bind(this, models, tokenBalanceCache)
  );
  router.post(
    '/bulkBalances',
    bulkBalances.bind(this, models, tokenBalanceCache)
  );
  router.get('/getTokensFromLists', getTokensFromLists.bind(this, models));
  router.get('/getTokenForum', getTokenForum.bind(this, models));
  router.get(
    '/getSupportedEthChains',
    getSupportedEthChains.bind(this, models)
  );

  // threads
  router.post(
    '/createThread',
    passport.authenticate('jwt', { session: false }),
    createThread.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  router.put(
    '/editThread',
    passport.authenticate('jwt', { session: false }),
    editThread.bind(this, models, banCache)
  );

  router.post(
    '/createPoll',
    passport.authenticate('jwt', { session: false }),
    createPoll.bind(this, models)
  );
  router.get('/getPolls', getPolls.bind(this, models));
  router.post(
    '/updateThreadStage',
    passport.authenticate('jwt', { session: false }),
    updateThreadStage.bind(this, models)
  );
  router.post(
    '/updateThreadPrivacy',
    passport.authenticate('jwt', { session: false }),
    updateThreadPrivacy.bind(this, models)
  );
  router.post(
    '/updateThreadPinned',
    passport.authenticate('jwt', { session: false }),
    updateThreadPinned.bind(this, models)
  );
  router.post(
    '/updateThreadLinkedChainEntities',
    passport.authenticate('jwt', { session: false }),
    updateThreadLinkedChainEntities.bind(this, models)
  );
  router.post(
    '/updateThreadLinkedSnapshotProposal',
    passport.authenticate('jwt', { session: false }),
    updateThreadLinkedSnapshotProposal.bind(this, models)
  );

  router.post(
    '/updateVote',
    passport.authenticate('jwt', { session: false }),
    updateVote.bind(this, models, tokenBalanceCache, ruleCache)
  );
  router.get('/viewVotes', viewVotes.bind(this, models));

  router.get('/fetchEntityTitle', fetchEntityTitle.bind(this, models));
  router.get(
    '/fetchThreadForSnapshot',
    fetchThreadForSnapshot.bind(this, models)
  );

  router.post(
    '/updateChainEntityTitle',
    passport.authenticate('jwt', { session: false }),
    updateChainEntityTitle.bind(this, models)
  );
  router.post(
    '/updateLinkedThreads',
    passport.authenticate('jwt', { session: false }),
    updateLinkedThreads.bind(this, models)
  );
  router.post(
    '/addEditors',
    passport.authenticate('jwt', { session: false }),
    addEditors.bind(this, models)
  );
  router.post(
    '/deleteEditors',
    passport.authenticate('jwt', { session: false }),
    deleteEditors.bind(this, models)
  );
  router.post(
    '/deleteThread',
    passport.authenticate('jwt', { session: false }),
    deleteThread.bind(this, models, banCache)
  );
  router.get('/bulkThreads', bulkThreads.bind(this, models));
  router.get('/activeThreads', activeThreads.bind(this, models));
  router.get('/getThreads', getThreadsOld.bind(this, models));
  router.get('/searchDiscussions', searchDiscussions.bind(this, models));
  router.get('/searchComments', searchComments.bind(this, models));

  router.get('/profile', getProfileOld.bind(this, models));

  // discussion drafts
  router.post(
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    createDraft.bind(this, models)
  );
  router.get('/drafts', getDrafts.bind(this, models));
  router.delete(
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    deleteDraft.bind(this, models)
  );
  router.patch(
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    editDraft.bind(this, models)
  );

  router.get('/bulkOffchain', bulkOffchain.bind(this, models));

  // comments
  router.post(
    '/createComment',
    passport.authenticate('jwt', { session: false }),
    createComment.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  router.post(
    '/editComment',
    passport.authenticate('jwt', { session: false }),
    editComment.bind(this, models, banCache)
  );
  router.post(
    '/deleteComment',
    passport.authenticate('jwt', { session: false }),
    deleteComment.bind(this, models, banCache)
  );
  router.get('/viewComments', viewComments.bind(this, models));
  router.get('/bulkComments', bulkComments.bind(this, models));

  // topics
  router.post(
    '/createTopic',
    passport.authenticate('jwt', { session: false }),
    createTopic.bind(this, models)
  );
  router.post(
    '/updateTopic',
    passport.authenticate('jwt', { session: false }),
    updateTopic.bind(this, models)
  );
  router.post(
    '/orderTopics',
    passport.authenticate('jwt', { session: false }),
    orderTopics.bind(this, models)
  );
  router.post(
    '/editTopic',
    passport.authenticate('jwt', { session: false }),
    editTopic.bind(this, models)
  );
  router.post(
    '/deleteTopic',
    passport.authenticate('jwt', { session: false }),
    deleteTopic.bind(this, models)
  );
  router.get('/bulkTopics', bulkTopics.bind(this, models));
  router.post(
    '/setTopicThreshold',
    passport.authenticate('jwt', { session: false }),
    setTopicThreshold.bind(this, models)
  );

  // reactions
  router.post(
    '/createReaction',
    passport.authenticate('jwt', { session: false }),
    createReaction.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  router.post(
    '/deleteReaction',
    passport.authenticate('jwt', { session: false }),
    deleteReaction.bind(this, models, banCache)
  );
  router.get('/viewReactions', viewReactions.bind(this, models));
  router.get('/bulkReactions', bulkReactions.bind(this, models));
  router.post('/reactionsCounts', reactionsCounts.bind(this, models));
  router.post(
    '/threadsUsersCountAndAvatars',
    threadsUsersCountAndAvatars.bind(this, models)
  );

  // roles + permissions
  router.get('/bulkMembers', bulkMembers.bind(this, models));
  router.post(
    '/createInvite',
    passport.authenticate('jwt', { session: false }),
    createInvite.bind(this, models)
  );
  router.post(
    '/acceptInvite',
    passport.authenticate('jwt', { session: false }),
    acceptInvite.bind(this, models)
  );
  router.post(
    '/addMember',
    passport.authenticate('jwt', { session: false }),
    addMember.bind(this, models)
  );
  router.post(
    '/upgradeMember',
    passport.authenticate('jwt', { session: false }),
    upgradeMember.bind(this, models)
  );

  // user model update
  router.post(
    '/updateEmail',
    passport.authenticate('jwt', { session: false }),
    updateEmail.bind(this, models)
  );

  // community banners (update or create)
  router.post(
    '/updateBanner',
    passport.authenticate('jwt', { session: false }),
    updateBanner.bind(this, models)
  );

  // fetch addresses (e.g. for mentions)
  router.get('/bulkAddresses', bulkAddresses.bind(this, models));

  // third-party webhooks
  router.post(
    '/createWebhook',
    passport.authenticate('jwt', { session: false }),
    createWebhook.bind(this, models)
  );
  router.post(
    '/updateWebhook',
    passport.authenticate('jwt', { session: false }),
    updateWebhook.bind(this, models)
  );
  router.post(
    '/deleteWebhook',
    passport.authenticate('jwt', { session: false }),
    deleteWebhook.bind(this, models)
  );
  router.get(
    '/getWebhooks',
    passport.authenticate('jwt', { session: false }),
    getWebhooks.bind(this, models)
  );

  // roles
  router.post(
    '/createRole',
    passport.authenticate('jwt', { session: false }),
    createRole.bind(this, models)
  );
  router.post(
    '/deleteRole',
    passport.authenticate('jwt', { session: false }),
    deleteRole.bind(this, models)
  );
  router.post(
    '/setDefaultRole',
    passport.authenticate('jwt', { session: false }),
    setDefaultRole.bind(this, models)
  );

  // profiles
  router.post(
    '/updateProfile',
    passport.authenticate('jwt', { session: false }),
    updateProfile.bind(this, models, identityFetchCache)
  );
  router.post('/bulkProfiles', bulkProfiles.bind(this, models));

  // social accounts
  router.delete(
    '/githubAccount',
    passport.authenticate('jwt', { session: false }),
    deleteSocialAccount.bind(this, models, 'github')
  );

  router.delete(
    '/discordAccount',
    passport.authenticate('jwt', { session: false }),
    deleteSocialAccount.bind(this, models, 'discord')
  );

  // viewCount
  router.post('/viewCount', viewCount.bind(this, models, viewCountCache));

  // attachments
  router.post(
    '/getUploadSignature',
    passport.authenticate('jwt', { session: false }),
    getUploadSignature.bind(this, models)
  );

  // notifications
  router.get(
    '/viewSubscriptions',
    passport.authenticate('jwt', { session: false }),
    viewSubscriptions.bind(this, models)
  );
  router.post(
    '/createSubscription',
    passport.authenticate('jwt', { session: false }),
    createSubscription.bind(this, models)
  );
  router.post(
    '/deleteSubscription',
    passport.authenticate('jwt', { session: false }),
    deleteSubscription.bind(this, models)
  );
  router.post(
    '/enableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    enableSubscriptions.bind(this, models)
  );
  router.post(
    '/disableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    disableSubscriptions.bind(this, models)
  );

  router.post(
    '/viewDiscussionNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models, NotificationCategories.Discussion)
  );

  router.post(
    '/viewChainEventNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models, NotificationCategories.ChainEvents)
  );

  router.post(
    '/viewUserActivity',
    passport.authenticate('jwt', { session: false }),
    viewUserActivity.bind(this, models)
  );
  router.post('/viewChainActivity', viewChainActivity.bind(this, models));
  router.post('/viewGlobalActivity', viewGlobalActivity.bind(this, models));
  router.post(
    '/markNotificationsRead',
    passport.authenticate('jwt', { session: false }),
    markNotificationsRead.bind(this, models)
  );
  router.post(
    '/clearReadNotifications',
    passport.authenticate('jwt', { session: false }),
    clearReadNotifications.bind(this, models)
  );
  router.post(
    '/clearNotifications',
    passport.authenticate('jwt', { session: false }),
    clearNotifications.bind(this, models)
  );
  router.post(
    '/enableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    enableImmediateEmails.bind(this, models)
  );
  router.post(
    '/disableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    disableImmediateEmails.bind(this, models)
  );
  router.post(
    '/setAddressWallet',
    passport.authenticate('jwt', { session: false }),
    setAddressWallet.bind(this, models)
  );

  // chain categories
  router.post(
    '/updateChainCategory',
    passport.authenticate('jwt', { session: false }),
    updateChainCategory.bind(this, models)
  );

  // chat
  router.get(
    '/getChatMessages',
    passport.authenticate('jwt', { session: false }),
    getChatMessages.bind(this, models)
  );

  router.get(
    '/getChatChannel',
    passport.authenticate('jwt', { session: false }),
    getChatChannel.bind(this, models)
  );

  router.post(
    '/createChatChannel',
    passport.authenticate('jwt', { session: false }),
    createChatChannel.bind(this, models)
  );

  router.delete(
    '/deleteChatChannel',
    passport.authenticate('jwt', { session: false }),
    deleteChatChannel.bind(this, models)
  );

  router.delete(
    '/deleteChatCategory',
    passport.authenticate('jwt', { session: false }),
    deleteChatCategory.bind(this, models)
  );

  router.put(
    '/editChatChannel',
    passport.authenticate('jwt', { session: false }),
    editChatChannel.bind(this, models)
  );

  router.put(
    '/editChatCategory',
    passport.authenticate('jwt', { session: false }),
    editChatCategory.bind(this, models)
  );

  // rules
  router.post(
    '/createRule',
    passport.authenticate('jwt', { session: false }),
    createRule.bind(this, models)
  );
  router.post(
    '/deleteRule',
    passport.authenticate('jwt', { session: false }),
    deleteRule.bind(this, models)
  );
  router.get('/getRuleTypes', getRuleTypes.bind(this, models));

  // settings
  router.post(
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models)
  );

  // send feedback button
  router.post('/sendFeedback', sendFeedback.bind(this, models));

  // bans
  router.post(
    '/banAddress',
    passport.authenticate('jwt', { session: false }),
    banAddress.bind(this, models)
  );

  router.get(
    '/getBannedAddresses',
    passport.authenticate('jwt', { session: false }),
    getBannedAddresses.bind(this, models)
  );

  // Custom domain update route
  router.post(
    '/updateChainCustomDomain',
    updateChainCustomDomain.bind(this, models)
  );

  router.post('/updateChainPriority', updateChainPriority.bind(this, models));
  router.post('/migrateEvent', migrateEvent.bind(this, models));

  // login
  router.post('/login', startEmailLogin.bind(this, models));
  router.get('/finishLogin', finishEmailLogin.bind(this, models));
  router.get('/finishOAuthLogin', finishOAuthLogin.bind(this, models));

  // OAuth2.0 for Discord and GitHub:
  // The way this works is first the /auth.discord route is hit and passport.authenticate triggers for the first time
  // to send a request for a code to the discord API passing along a state parameter and a callback. The Discord api
  // adds the same state parameter to the callback URL (and a new code param) before returning. Once Discord returns,
  // /auth/discord/callback is called which triggers passport.authenticate for a second time. On this second run the
  // authenticateSocialAccount function in socialAccount.ts is called. If a successRedirect url is specified, in the
  // passport.authenticate options then the passport.authenticate function will handle redirecting after the
  // authenticateSocialAccount function and WILL NOT trigger the route handler for the callback routes (startOAuthLogin)

  // You cac put any data you wish to persist post OAuth into the state object below. The data will be made available
  // ONLY in the req.authInfo.state object in the callback i.e. startOAuthLogin.ts.
  // NOTE: if a successfulRedirect url is used in the options then there is no way to access that data.

  router.get('/auth/github', (req, res, next) => {
    passport.authenticate('github', <any>{ state: { hostname: req.hostname } })(
      req,
      res,
      next
    );
  });
  router.get(
    '/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/',
    }),
    startOAuthLogin.bind(this, models, 'github')
  );

  router.get('/auth/discord', (req, res, next) => {
    passport.authenticate('discord', <any>{
      state: { hostname: req.hostname },
    })(req, res, next);
  });

  router.get(
    '/auth/discord/callback',
    passport.authenticate('discord', {
      failureRedirect: '/',
    }),
    startOAuthLogin.bind(this, models, 'discord')
  );

  router.post(
    '/auth/magic',
    passport.authenticate('magic'),
    (req, res, next) => {
      return res.json({ status: 'Success', result: req.user.toJSON() });
    }
  );

  router.post('/auth/sso', startSsoLogin.bind(this, models));
  router.post(
    '/auth/sso/callback',
    // passport.authenticate('jwt', { session: false }),
    finishSsoLogin.bind(this, models)
  );

  router.get(
    '/auth/callback',
    passport.authenticate('jwt', { session: false }),
    authCallback.bind(this, models)
  );

  // logout
  router.get('/logout', logout.bind(this, models));

  // TODO: Change to GET /entities
  router.get('/bulkEntities', bulkEntities.bind(this, models));

  router.post('/snapshotAPI/sendMessage', sendMessage.bind(this));
  router.get('/communityStats', communityStats.bind(this, models));

  // new API
  addExternalRoutes(router, app, models, tokenBalanceCache);

  app.use('/api', router);
}

export default setupRouter;
