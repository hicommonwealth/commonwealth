const Errors = {
  NotAdmin: 'Not an admin of chain or community',
  NotLoggedIn: 'Not logged in',
  NoCategoryAndObjectId: 'Must provide category and object id',
  InvalidNotificationCategory: 'invalid notification category',
  NoSubscriptionId: 'Must provide subscription id(s)',
  NoSubscription: 'Subscription not found',
  NotUsersSubscription: 'Subscription does not belong to user',
  NoMentions: 'Cannot make New Mention Subscription from this route',
  NoComment: 'Cannot find comment model for new subscription',
  NoThread: 'Cannot find thread model for new subscription',
  NoCommentOrReactionEntity: 'No entity to associate subscription found',
  ChainRequiredForEntity: 'Chain id required for ChainEntity association',
  NoChainEntity: 'Cannot find ChainEntity',
  InvalidChain: 'Invalid chain',
  InvalidChainEventId: 'Invalid ChainEvent id'
};

export default Errors;
