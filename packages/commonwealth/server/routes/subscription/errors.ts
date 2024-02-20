const Errors = {
  NotAdmin: 'Not an admin of chain or community',
  NotLoggedIn: 'Not signed in',
  NoCategory: 'Must provide a category',
  InvalidNotificationCategory: 'invalid notification category',
  InvalidSubscriptionCategory:
    'Subscriptions of this category are not supported',
  NoSubscriptionId: 'Must provide subscription id(s)',
  NoSubscription: 'Subscription not found',
  NotUsersSubscription: 'Subscription does not belong to user',
  NoMentions: 'Cannot make New Mention Subscription from this route',
  NoCollaborations:
    'Cannot make New Collaboration Subscription from this route',
  NoComment: 'Cannot find comment model for new subscription',
  NoThread: 'Cannot find thread model for new subscription',
  InvalidCommunity: 'Invalid community',
  InvalidChainEventId: 'Invalid ChainEvent id',
  InvalidSnapshotSpace: 'Invalid snapshot space',
  NoMentionDelete: 'Cannot delete mention subscription',
  NoThreadOrComment: 'Must provide thread or comment id',
  BothThreadAndComment: 'Must provide thread or comment id, not both',
};

export default Errors;
