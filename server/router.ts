import express from 'express';
import passport from 'passport';
import type { Express } from 'express';

import domain from './routes/domain';
import status from './routes/status';
import createGist from './routes/createGist';

import edgewareLockdropEvents from './routes/edgeware_lockdrop_events';
import edgewareLockdropBalances from './routes/edgeware_lockdrop_balances';

import createAddress from './routes/createAddress';
import linkExistingAddressToChain from './routes/linkExistingAddressToChain';
import verifyAddress from './routes/verifyAddress';
import deleteAddress from './routes/deleteAddress';
import getAddressStatus from './routes/getAddressStatus';
import selectNode from './routes/selectNode';
import startEmailLogin from './routes/startEmailLogin';
import finishEmailLogin from './routes/finishEmailLogin';
import finishOAuthLogin from './routes/finishOAuthLogin';
import startOAuthLogin from './routes/startOAuthLogin';
import createComment from './routes/createComment';
import editComment from './routes/editComment';
import deleteComment from './routes/deleteComment';
import viewComments from './routes/viewComments';
import bulkComments from './routes/bulkComments';
import createReaction from './routes/createReaction';
import deleteReaction from './routes/deleteReaction';
import viewReactions from './routes/viewReactions';
import bulkReactions from './routes/bulkReactions';
import reactionsCounts from './routes/reactionsCounts';
import threadsUsersCountAndAvatars from './routes/threadsUsersCountAndAvatars';
import starCommunity from './routes/starCommunity';
import createChain from './routes/createChain';
import viewCount from './routes/viewCount';
import updateEmail from './routes/updateEmail';

import viewSubscriptions from './routes/subscription/viewSubscriptions';
import createSubscription from './routes/subscription/createSubscription';
import deleteSubscription from './routes/subscription/deleteSubscription';
import enableSubscriptions from './routes/subscription/enableSubscriptions';
import disableSubscriptions from './routes/subscription/disableSubscriptions';
import enableImmediateEmails from './routes/subscription/enableImmediateEmails';
import disableImmediateEmails from './routes/subscription/disableImmediateEmails';
import viewNotifications from './routes/viewNotifications';
import markNotificationsRead from './routes/markNotificationsRead';
import clearReadNotifications from './routes/clearReadNotifications';
import clearNotifications from './routes/clearNotifications';
import bulkMembers from './routes/bulkMembers';
import bulkAddresses from './routes/bulkAddresses';
import createInvite from './routes/createInvite';
import getInvites from './routes/getInvites';
import acceptInvite from './routes/acceptInvite';
import addMember from './routes/addMember';
import upgradeMember from './routes/upgradeMember';
import deleteSocialAccount from './routes/deleteSocialAccount';
import getProfile from './routes/getProfile';

import createRole from './routes/createRole';
import deleteRole from './routes/deleteRole';
import setDefaultRole from './routes/setDefaultRole';

import getUploadSignature from './routes/getUploadSignature';
import activeThreads from './routes/activeThreads';
import createThread from './routes/createThread';
import editThread from './routes/editThread';
import updateThreadPolling from './routes/updateThreadPolling';
import updateThreadStage from './routes/updateThreadStage';
import updateThreadPrivacy from './routes/updateThreadPrivacy';
import updateThreadPinned from './routes/updateThreadPinned';
import updateThreadLinkedChainEntities from './routes/updateThreadLinkedChainEntities';
import updateThreadLinkedSnapshotProposal from './routes/updateThreadLinkedSnapshotProposal';
import updateOffchainVote from './routes/updateOffchainVote';
import viewOffchainVotes from './routes/viewOffchainVotes';
import fetchEntityTitle from './routes/fetchEntityTitle';
import fetchThreadForSnapshot from './routes/fetchThreadForSnapshot';
import updateChainEntityTitle from './routes/updateChainEntityTitle';
import updateLinkedThreads from './routes/updateLinkedThreads';
import deleteThread from './routes/deleteThread';
import addEditors from './routes/addEditors';
import deleteEditors from './routes/deleteEditors';
import bulkThreads from './routes/bulkThreads';
import getThreads from './routes/getThreads';
import searchDiscussions from './routes/searchDiscussions'
import searchComments from './routes/searchComments'
import createDraft from './routes/drafts/createDraft';
import deleteDraft from './routes/drafts/deleteDraft';
import editDraft from './routes/drafts/editDraft';
import getDrafts from './routes/drafts/getDrafts';
import addChainNode from './routes/addChainNode';
import deleteChain from './routes/deleteChain';
import deleteChainNode from './routes/deleteChainNode';
import updateChain from './routes/updateChain';
import bulkProfiles from './routes/bulkProfiles';
import updateProfile from './routes/updateProfile';
import writeUserSetting from './routes/writeUserSetting';
import sendFeedback from './routes/sendFeedback';
import logout from './routes/logout';
import createTopic from './routes/createTopic';
import updateTopics from './routes/updateTopics';
import editTopic from './routes/editTopic';
import deleteTopic from './routes/deleteTopic';
import bulkTopics from './routes/bulkTopics';
import bulkOffchain from './routes/bulkOffchain';
import setTopicThreshold from './routes/setTopicThreshold';

import edgewareLockdropLookup from './routes/getEdgewareLockdropLookup';
import edgewareLockdropStats from './routes/getEdgewareLockdropStats';
import createWebhook from './routes/webhooks/createWebhook';
import updateWebhook from './routes/webhooks/updateWebhook';
import deleteWebhook from './routes/webhooks/deleteWebhook';
import getWebhooks from './routes/webhooks/getWebhooks';
import ViewCountCache from './util/viewCountCache';
import IdentityFetchCache from './util/identityFetchCache';
import TokenBalanceCache from './util/tokenBalanceCache';

import bulkEntities from './routes/bulkEntities';
import { getTokensFromLists } from './routes/getTokensFromLists';
import getTokenForum from './routes/getTokenForum';
import getSupportedEthChains from './routes/getSupportedEthChains';
import getSubstrateSpec from './routes/getSubstrateSpec';
import editSubstrateSpec from './routes/editSubstrateSpec';
import { getStatsDInstance } from './util/metrics';
import updateAddress from './routes/updateAddress';
import { DB } from './database';
import { sendMessage } from './routes/snapshotAPI';

function setupRouter(
  app: Express,
  models: DB,
  viewCountCache: ViewCountCache,
  identityFetchCache: IdentityFetchCache,
  tokenBalanceCache: TokenBalanceCache
) {
  const router = express.Router();

  router.use((req, res, next) => {
    getStatsDInstance().increment(`cw.path.${req.path.slice(1)}.called`);
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      getStatsDInstance().histogram(
        `cw.path.${req.path.slice(1)}.latency`,
        latency
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

  router.get('/getSubstrateSpec', getSubstrateSpec.bind(this, models));
  router.post(
    '/editSubstrateSpec',
    passport.authenticate('jwt', { session: false }),
    editSubstrateSpec.bind(this, models)
  );

  router.post(
    '/createGist',
    passport.authenticate('jwt', { session: false }),
    createGist.bind(this, models)
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
    '/selectNode',
    passport.authenticate('jwt', { session: false }),
    selectNode.bind(this, models)
  );

  // chains
  router.post(
    '/addChainNode',
    passport.authenticate('jwt', { session: false }),
    addChainNode.bind(this, models)
  );
  router.post(
    '/deleteChain',
    passport.authenticate('jwt', { session: false }),
    deleteChain.bind(this, models)
  );
  router.post(
    '/deleteChainNode',
    passport.authenticate('jwt', { session: false }),
    deleteChainNode.bind(this, models)
  );
  router.post(
    '/updateChain',
    passport.authenticate('jwt', { session: false }),
    updateChain.bind(this, models)
  );

  // offchain communities
  router.post(
    '/starCommunity',
    passport.authenticate('jwt', { session: false }),
    starCommunity.bind(this, models)
  );

  // offchain community admin routes
  router.get('/getTokensFromLists', getTokensFromLists.bind(this, models));
  router.get('/getTokenForum', getTokenForum.bind(this, models));
  router.get('/getSupportedEthChains', getSupportedEthChains.bind(this, models));
  router.post(
    '/createChain',
    passport.authenticate('jwt', { session: false }),
    createChain.bind(this, models)
  );

  // offchain threads
  router.post(
    '/createThread',
    passport.authenticate('jwt', { session: false }),
    createThread.bind(this, models, tokenBalanceCache)
  );
  router.put(
    '/editThread',
    passport.authenticate('jwt', { session: false }),
    editThread.bind(this, models)
  );

  router.post(
    '/updateThreadPolling',
    passport.authenticate('jwt', { session: false }),
    updateThreadPolling.bind(this, models)
  );
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
    '/updateOffchainVote',
    passport.authenticate('jwt', { session: false }),
    updateOffchainVote.bind(this, models, tokenBalanceCache)
  );
  router.get('/viewOffchainVotes', viewOffchainVotes.bind(this, models));

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
    deleteThread.bind(this, models)
  );
  router.get('/bulkThreads', bulkThreads.bind(this, models));
  router.get('/activeThreads', activeThreads.bind(this, models));
  router.get('/getThreads', getThreads.bind(this, models));
  router.get('/searchDiscussions', searchDiscussions.bind(this, models));
  router.get('/searchComments', searchComments.bind(this, models));

  router.get('/profile', getProfile.bind(this, models));

  // offchain discussion drafts
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

  // offchain comments
  router.post(
    '/createComment',
    passport.authenticate('jwt', { session: false }),
    createComment.bind(this, models, tokenBalanceCache)
  );
  router.post(
    '/editComment',
    passport.authenticate('jwt', { session: false }),
    editComment.bind(this, models)
  );
  router.post(
    '/deleteComment',
    passport.authenticate('jwt', { session: false }),
    deleteComment.bind(this, models)
  );
  router.get('/viewComments', viewComments.bind(this, models));
  router.get('/bulkComments', bulkComments.bind(this, models));

  // offchain topics
  router.post(
    '/createTopic',
    passport.authenticate('jwt', { session: false }),
    createTopic.bind(this, models)
  );
  router.post(
    '/updateTopics',
    passport.authenticate('jwt', { session: false }),
    updateTopics.bind(this, models)
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

  // offchain reactions
  router.post(
    '/createReaction',
    passport.authenticate('jwt', { session: false }),
    createReaction.bind(this, models, tokenBalanceCache)
  );
  router.post(
    '/deleteReaction',
    passport.authenticate('jwt', { session: false }),
    deleteReaction.bind(this, models)
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
  router.get(
    '/getInvites',
    passport.authenticate('jwt', { session: false }),
    getInvites.bind(this, models)
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

  // offchain profiles
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
  )

  // offchain viewCount
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
    '/viewNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models)
  );
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

  // settings
  router.post(
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models)
  );

  // send feedback button
  router.post('/sendFeedback', sendFeedback.bind(this, models));

  // stats
  // edgeware
  router.get(
    '/stats/edgeware/lockdrop/events',
    edgewareLockdropEvents.bind(this, models)
  );
  router.get(
    '/stats/edgeware/lockdrop/balances',
    edgewareLockdropBalances.bind(this, models)
  );

  // login
  router.post('/login', startEmailLogin.bind(this, models));
  router.get('/finishLogin', finishEmailLogin.bind(this, models));

  router.get('/auth/github', startOAuthLogin.bind(this, models, 'github'));
  router.get('/auth/github/callback', startOAuthLogin.bind(this, models, 'github'));
  router.get('/finishOAuthLogin', finishOAuthLogin.bind(this, models));

  router.get('/auth/discord', startOAuthLogin.bind(this, models, 'discord'));
  router.get('/auth/discord/callback', startOAuthLogin.bind(this, models, 'discord'));

  router.post(
    '/auth/magic',
    passport.authenticate('magic'),
    (req, res, next) => {
      return res.json({ status: 'Success', result: req.user.toJSON() });
    }
  );

  // logout
  router.get('/logout', logout.bind(this, models));

  router.get(
    '/edgewareLockdropLookup',
    edgewareLockdropLookup.bind(this, models)
  );
  router.get(
    '/edgewareLockdropStats',
    edgewareLockdropStats.bind(this, models)
  );

  // TODO: Change to GET /entities
  router.get('/bulkEntities', bulkEntities.bind(this, models));

  router.post('/snapshotAPI/sendMessage', sendMessage.bind(this));

  app.use('/api', router);
}

export default setupRouter;
