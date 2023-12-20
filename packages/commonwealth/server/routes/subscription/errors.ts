import { TRPCError } from '@trpc/server';

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
  InvalidChain: 'Invalid chain',
  InvalidChainEventId: 'Invalid ChainEvent id',
  InvalidSnapshotSpace: 'Invalid snapshot space',
  NoMentionDelete: 'Cannot delete mention subscription',
  NoThreadOrComment: 'Must provide thread or comment id',
  BothThreadAndComment: 'Must provide thread or comment id, not both',
};

export const TrpcError: Record<string, TRPCError> = {
  NotAdmin: new TRPCError({ code: 'BAD_REQUEST', message: Errors.NotAdmin }),
  NotLoggedIn: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NotLoggedIn,
  }),
  NoCategory: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoCategory,
  }),
  InvalidNotificationCategory: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.InvalidNotificationCategory,
  }),
  InvalidSubscriptionCategory: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.InvalidSubscriptionCategory,
  }),
  NoSubscriptionId: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoSubscriptionId,
  }),
  NoSubscription: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoSubscription,
  }),
  NotUsersSubscription: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NotUsersSubscription,
  }),
  NoMentions: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoMentions,
  }),
  NoCollaborations: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoCollaborations,
  }),
  NoComment: new TRPCError({ code: 'BAD_REQUEST', message: Errors.NoComment }),
  NoThread: new TRPCError({ code: 'BAD_REQUEST', message: Errors.NoThread }),
  InvalidChain: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.InvalidChain,
  }),
  InvalidChainEventId: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.InvalidChainEventId,
  }),
  InvalidSnapshotSpace: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.InvalidSnapshotSpace,
  }),
  NoMentionDelete: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoMentionDelete,
  }),
  NoThreadOrComment: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.NoThreadOrComment,
  }),
  BothThreadAndComment: new TRPCError({
    code: 'BAD_REQUEST',
    message: Errors.BothThreadAndComment,
  }),
};
export default Errors;
