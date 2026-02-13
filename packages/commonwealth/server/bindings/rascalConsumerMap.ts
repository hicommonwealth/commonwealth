import { buildRetryStrategy } from '@hicommonwealth/adapters';
import {
  Consumer,
  EventsHandlerMetadata,
  RoutingKeyTags,
  stats,
} from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  ChainEvents,
  Community,
  CommunityGoalsPolicy,
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  EventStreamPolicy,
  FarcasterWorker,
  LaunchpadPolicy,
  NotificationsPolicy,
  NotificationsSettingsPolicy,
  PredictionMarket,
  Reaction,
  Token,
  TwitterEngagementPolicy,
  User,
} from '@hicommonwealth/model';

const _ContestWorker: Consumer<ReturnType<typeof ContestWorker>> = {
  consumer: ContestWorker,
  retryStrategy: buildRetryStrategy(undefined, 20_000),
  hooks: {
    beforeHandleEvent: (topic, event, context) => {
      context.start = Date.now();
    },
    afterHandleEvent: (topic, event, context) => {
      const duration = Date.now() - context.start;
      const handler = `${topic}.${event.name}`;
      stats().histogram(`cw.handlerExecutionTime`, duration, { handler });
    },
  },
  overrides: {
    ThreadCreated: `ThreadCreated.${RoutingKeyTags.Contest}.#`,
    ThreadUpvoted: `ThreadUpvoted.${RoutingKeyTags.Contest}.#`,
  },
};

const _FarcasterWorker: Consumer<ReturnType<typeof FarcasterWorker>> = {
  consumer: FarcasterWorker,
  retryStrategy: buildRetryStrategy(undefined, 20_000),
};

const _Xp: Consumer<ReturnType<typeof User.Xp>> = {
  consumer: User.Xp,
  overrides: {
    ThreadCreated: `ThreadCreated.#`,
    ThreadUpvoted: `ThreadUpvoted.#`,
  },
};

const _NotificationsSettingsPolicy = {
  consumer: NotificationsSettingsPolicy,
};

const _NotificationsPolicy = {
  consumer: NotificationsPolicy,
  // This disables retry strategies on any handler error/failure
  // This is because we cannot guarantee whether a Knock workflow trigger
  // call was successful or not. It is better to 'miss' notifications then
  // to double send a notification
  retryStrategy: buildRetryStrategy(
    (err, topic, content, ackOrNackFn, log_) => {
      log_.error(err.message, err, {
        topic,
        message: content,
      });
      ackOrNackFn({ strategy: 'ack' });
      return true;
    },
  ),
  overrides: {
    ThreadUpvoted: `ThreadUpvoted.#`,
    CommunityCreated: null,
    SignUpFlowCompleted: null,
    CommunityJoined: null,
  },
};

const _ReactionWorkerProjection = {
  consumer: Reaction.ReactionWorkerProjection,
};

const _GovernanceProjection = {
  consumer: ChainEvents.GovernanceProjection,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rascalConsumerMap: Consumer<EventsHandlerMetadata<any>>[] = [
  ChainEventPolicy,
  Community.ChainEventProjection,
  Community.NominationsProjection,
  DiscordBotPolicy,
  Contest.Contests,
  Contest.FarcasterContestProjection,
  FarcasterWorker,
  EventStreamPolicy,
  NotificationsSettingsPolicy,
  User.CreateUnverifiedUser,
  Token.LaunchpadTradeProjection,
  TwitterEngagementPolicy,
  CommunityGoalsPolicy,
  LaunchpadPolicy,
  PredictionMarket.PredictionMarketProjection,
  _ContestWorker,
  _GovernanceProjection,
  _FarcasterWorker,
  _Xp,
  _NotificationsSettingsPolicy,
  _NotificationsPolicy,
  _ReactionWorkerProjection,
];
