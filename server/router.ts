import express from 'express';
import webpack from 'webpack';
import passport from 'passport';

import status from './routes/status';
import createGist from './routes/createGist';

import edgewareLockdropEvents from './routes/edgeware_lockdrop_events';
import edgewareLockdropBalances from './routes/edgeware_lockdrop_balances';
import supernovaLockdropATOMLocks from './routes/supernova_lockdrop_atom_locks';
import supernovaLockdropBTCLocks from './routes/supernova_lockdrop_btc_locks';
import supernovaLockdropETHLocks from './routes/supernova_lockdrop_eth_locks';

import createHedgehogAuthentication from './routes/createHedgehogAuthentication';
import getHedgehogAuthentication from './routes/getHedgehogAuthentication';
import createHedgehogUser from './routes/createHedgehogUser';

import createAddress from './routes/createAddress';
import verifyAddress from './routes/verifyAddress';
import deleteAddress from './routes/deleteAddress';
import selectNode from './routes/selectNode';
import startEmailLogin from './routes/startEmailLogin';
import finishEmailLogin from './routes/finishEmailLogin';
import createComment from './routes/createComment';
import editComment from './routes/editComment';
import deleteComment from './routes/deleteComment';
import viewComments from './routes/viewComments';
import bulkComments from './routes/bulkComments';
import createReaction from './routes/createReaction';
import deleteReaction from './routes/deleteReaction';
import viewReactions from './routes/viewReactions';
import bulkReactions from './routes/bulkReactions';
import createCommunity from './routes/createCommunity';
import deleteCommunity from './routes/deleteCommunity';
import updateCommunity from './routes/updateCommunity';
import viewCount from './routes/viewCount';

import viewSubscriptions from './routes/viewSubscriptions';
import createSubscription from './routes/createSubscription';
import deleteSubscription from './routes/deleteSubscription';
import enableSubscriptions from './routes/enableSubscriptions';
import disableSubscriptions from './routes/disableSubscriptions';
import enableImmediateEmails from './routes/enableImmediateEmails';
import disableImmediateEmails from './routes/disableImmediateEmails';
import viewNotifications from './routes/viewNotifications';
import markNotificationsRead from './routes/markNotificationsRead';
import clearReadNotifications from './routes/clearReadNotifications';
import bulkMembers from './routes/bulkMembers';
import bulkAddresses from './routes/bulkAddresses';
import createInvite from './routes/createInvite';
import getInvites from './routes/getInvites';
import acceptInvite from './routes/acceptInvite';
import addMember from './routes/addMember';
import upgradeMember from './routes/upgradeMember';
import createInviteLink from './routes/createInviteLink';
import acceptInviteLink from './routes/acceptInviteLink';
import getInviteLinks from './routes/getInviteLinks';

import createRole from './routes/createRole';
import deleteRole from './routes/deleteRole';

import getUploadSignature from './routes/getUploadSignature';
import registerWaitingList from './routes/registerWaitingList';
import createThread from './routes/createThread';
import editThread from './routes/editThread';
import deleteThread from './routes/deleteThread';
import bulkThreads from './routes/bulkThreads';
import addChainNode from './routes/addChainNode';
import deleteChain from './routes/deleteChain';
import deleteChainNode from './routes/deleteChainNode';
import updateChain from './routes/updateChain';
import bulkProfiles from './routes/bulkProfiles';
import updateProfile from './routes/updateProfile';
import writeUserSetting from './routes/writeUserSetting';
import sendFeedback from './routes/sendFeedback';
import logout from './routes/logout';
import createTag from './routes/createTag';
import updateTags from './routes/updateTags';
import editTag from './routes/editTag';
import deleteTag from './routes/deleteTag';
import bulkTags from './routes/bulkTags';

import addChainObjectQuery from './routes/addChainObjectQuery';
import deleteChainObjectQuery from './routes/deleteChainObjectQuery';
import viewChainObjectQueries from './routes/viewChainObjectQueries';
import viewChainObjects from './routes/viewChainObjects';
import refreshChainObjects from './routes/refreshChainObjects';
import edgewareLockdropLookup from './routes/getEdgewareLockdropLookup';
import edgewareLockdropStats from './routes/getEdgewareLockdropStats';
import createWebhook from './routes/webhooks/createWebhook';
import deleteWebhook from './routes/webhooks/deleteWebhook';
import getWebhooks from './routes/webhooks/getWebhooks';
import ViewCountCache from './util/viewCountCache';

import bulkEntities from './routes/bulkEntities';

function setupRouter(app, models, fetcher, viewCountCache: ViewCountCache) {
  const router = express.Router();

  router.get('/status', status.bind(this, models));

  router.post('/createGist', passport.authenticate('jwt', { session: false }), createGist.bind(this, models));
  router.post('/createAddress', createAddress.bind(this, models));
  router.post('/verifyAddress', verifyAddress.bind(this, models));
  router.post('/deleteAddress', passport.authenticate('jwt', { session: false }), deleteAddress.bind(this, models));
  router.post('/selectNode', passport.authenticate('jwt', { session: false }), selectNode.bind(this, models));

  // chains
  router.post('/addChainNode', passport.authenticate('jwt', { session: false }), addChainNode.bind(this, models));
  router.post('/deleteChain', passport.authenticate('jwt', { session: false }), deleteChain.bind(this, models));
  router.post('/deleteChainNode', passport.authenticate('jwt', { session: false }), deleteChainNode.bind(this, models));
  router.post('/updateChain', passport.authenticate('jwt', { session: false }), updateChain.bind(this, models));

  // offchain communities
  router.post('/createCommunity', passport.authenticate('jwt', { session: false }), createCommunity.bind(this, models));
  router.post('/deleteCommunity', passport.authenticate('jwt', { session: false }), deleteCommunity.bind(this, models));
  router.post('/updateCommunity', passport.authenticate('jwt', { session: false }), updateCommunity.bind(this, models));

  // offchain threads
  router.post('/createThread', passport.authenticate('jwt', { session: false }), createThread.bind(this, models));
  router.post('/editThread', passport.authenticate('jwt', { session: false }), editThread.bind(this, models));
  router.post('/deleteThread', passport.authenticate('jwt', { session: false }), deleteThread.bind(this, models));
  router.get('/bulkThreads', bulkThreads.bind(this, models));

  // offchain comments
  router.post('/createComment', passport.authenticate('jwt', { session: false }), createComment.bind(this, models));
  router.post('/editComment', passport.authenticate('jwt', { session: false }), editComment.bind(this, models));
  router.post('/deleteComment', passport.authenticate('jwt', { session: false }), deleteComment.bind(this, models));
  router.get('/viewComments', viewComments.bind(this, models));
  router.get('/bulkComments', bulkComments.bind(this, models));

  // offchain tags
  router.post('/createTag', passport.authenticate('jwt', { session: false }), createTag.bind(this, models));
  router.post('/updateTags', passport.authenticate('jwt', { session: false }), updateTags.bind(this, models));
  router.post('/editTag', passport.authenticate('jwt', { session: false }), editTag.bind(this, models));
  router.post('/deleteTag', passport.authenticate('jwt', { session: false }), deleteTag.bind(this, models));
  router.get('/bulkTags', bulkTags.bind(this, models));

  // offchain reactions
  router.post('/createReaction', passport.authenticate('jwt', { session: false }), createReaction.bind(this, models));
  router.post('/deleteReaction', passport.authenticate('jwt', { session: false }), deleteReaction.bind(this, models));
  router.get('/viewReactions', viewReactions.bind(this, models));
  router.get('/bulkReactions', bulkReactions.bind(this, models));

  // generic invite link
  router.post('/createInviteLink', passport.authenticate('jwt', { session: false }), createInviteLink.bind(this, models));
  router.get('/acceptInviteLink', acceptInviteLink.bind(this, models));
  router.get('/getInviteLinks', passport.authenticate('jwt', { session: false }), getInviteLinks.bind(this, models));

  // roles + permissions
  router.get('/bulkMembers', bulkMembers.bind(this, models));
  router.post('/createInvite', passport.authenticate('jwt', { session: false }), createInvite.bind(this, models));
  router.get('/getInvites', passport.authenticate('jwt', { session: false }), getInvites.bind(this, models));
  router.post('/acceptInvite', passport.authenticate('jwt', { session: false }), acceptInvite.bind(this, models));
  router.post('/addMember', passport.authenticate('jwt', { session: false }), addMember.bind(this, models));
  router.post('/upgradeMember', passport.authenticate('jwt', { session: false }), upgradeMember.bind(this, models));

  // fetch addresses (e.g. for mentions)
  router.get('/bulkAddresses', bulkAddresses.bind(this, models));

  // third-party webhooks
  router.post('/createWebhook', passport.authenticate('jwt', { session: false }), createWebhook.bind(this, models));
  router.post('/deleteWebhook', passport.authenticate('jwt', { session: false }), deleteWebhook.bind(this, models));
  router.get('/getWebhooks', passport.authenticate('jwt', { session: false }), getWebhooks.bind(this, models));

  // roles
  router.post('/createRole', passport.authenticate('jwt', { session: false }), createRole.bind(this, models));
  router.post('/deleteRole', passport.authenticate('jwt', { session: false }), deleteRole.bind(this, models));

  // offchain profiles
  router.post('/updateProfile', passport.authenticate('jwt', { session: false }), updateProfile.bind(this, models));
  router.post('/bulkProfiles', bulkProfiles.bind(this, models));

  // offchain viewCount
  router.post('/viewCount', viewCount.bind(this, models, viewCountCache));

  // attachments
  router.post('/getUploadSignature', passport.authenticate('jwt', { session: false }), getUploadSignature.bind(this, models));

  // homepage and waiting lists
  router.post('/registerWaitingList', registerWaitingList.bind(this, models));

  // notifications
  router.get('/viewSubscriptions', passport.authenticate('jwt', { session: false }),
    viewSubscriptions.bind(this, models));
  router.post('/createSubscription', passport.authenticate('jwt', { session: false }),
    createSubscription.bind(this, models));
  router.post('/deleteSubscription', passport.authenticate('jwt', { session: false }),
    deleteSubscription.bind(this, models));
  router.post('/enableSubscriptions', passport.authenticate('jwt', { session: false }),
    enableSubscriptions.bind(this, models));
  router.post('/disableSubscriptions', passport.authenticate('jwt', { session: false }),
    disableSubscriptions.bind(this, models));
  router.post('/viewNotifications', passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models));
  router.post('/markNotificationsRead', passport.authenticate('jwt', { session: false }),
    markNotificationsRead.bind(this, models));
  router.post('/clearReadNotifications', passport.authenticate('jwt', { session: false }),
    clearReadNotifications.bind(this, models));
  router.post('/enableImmediateEmails', passport.authenticate('jwt', { session: false }),
    enableImmediateEmails.bind(this, models));
  router.post('/disableImmediateEmails', passport.authenticate('jwt', { session: false }),
    disableImmediateEmails.bind(this, models));

  // settings
  router.post('/writeUserSetting', passport.authenticate('jwt', { session: false }),
              writeUserSetting.bind(this, models));

  // send feedback button
  router.post('/sendFeedback', sendFeedback.bind(this, models));

  // stats
  // edgeware
  router.get('/stats/edgeware/lockdrop/events', edgewareLockdropEvents.bind(this, models));
  router.get('/stats/edgeware/lockdrop/balances', edgewareLockdropBalances.bind(this, models));
  // supernova
  router.get('/stats/supernova/lockdrop/atom', supernovaLockdropATOMLocks.bind(this, models));
  router.get('/stats/supernova/lockdrop/btc', supernovaLockdropBTCLocks.bind(this, models));
  router.get('/stats/supernova/lockdrop/eth', supernovaLockdropETHLocks.bind(this, models));
  // login
  router.post('/login', startEmailLogin.bind(this, models));
  router.get('/finishLogin', finishEmailLogin.bind(this, models));
  router.get('/auth/github', passport.authenticate('github'));
  router.get('/auth/github/callback',
             passport.authenticate('github', { successRedirect: '/', failureRedirect: '/#!/login' }));
  // hedgehog login
  router.post('/createHedgehogAuthentication', createHedgehogAuthentication.bind(this, models));
  router.get('/getHedgehogAuthentication', getHedgehogAuthentication.bind(this, models));
  router.post('/createHedgehogUser', createHedgehogUser.bind(this, models));
  // logout
  router.get('/logout', logout.bind(this, models));

  router.post('/addChainObjectQuery', passport.authenticate('jwt', { session: false }),
    addChainObjectQuery.bind(this, models));
  router.post('/deleteChainObjectQuery', passport.authenticate('jwt', { session: false }),
    deleteChainObjectQuery.bind(this, models));
  router.post('/viewChainObjectQueries', passport.authenticate('jwt', { session: false }),
    viewChainObjectQueries.bind(this, models));
  router.get('/viewChainObjects', viewChainObjects.bind(this, models));
  router.get('/refreshChainObjects', refreshChainObjects.bind(this, models, fetcher));

  router.get('/edgewareLockdropLookup', edgewareLockdropLookup.bind(this, models));
  router.get('/edgewareLockdropStats', edgewareLockdropStats.bind(this, models));

  router.get('/bulkEntities', bulkEntities.bind(this, models));

  app.use('/api', router);
}
export default setupRouter;
