import { buildRetryStrategy } from '@hicommonwealth/adapters';
import {
  Consumer,
  EventsHandlerMetadata,
  RoutingKeyTags,
  stats,
} from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  CommunityGoalsPolicy,
  Contest,
  ContestWorker,
  CreateUnverifiedUser,
  DiscordBotPolicy,
  EventStreamPolicy,
  FarcasterWorker,
  LaunchpadPolicy,
  NominationsWorker,
  NotificationsPolicy,
  ReactionWorker,
  TwitterEngagementPolicy,
  User,
} from '@hicommonwealth/model';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

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
  worker: 'knock',
};

const _NotificationsPolicy = {
  consumer: NotificationsPolicy,
  worker: 'knock',
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
    ThreadCreated: null,
    ThreadUpvoted: `ThreadUpvoted.#`,
  },
};

const _ReactionWorker = {
  consumer: ReactionWorker,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rascalConsumerMap: Consumer<EventsHandlerMetadata<any>>[] = [
  LaunchpadPolicy,
  ChainEventPolicy,
  DiscordBotPolicy,
  Contest.Contests,
  NominationsWorker,
  FarcasterWorker,
  EventStreamPolicy,
  NotificationsSettingsPolicy,
  CreateUnverifiedUser,
  TwitterEngagementPolicy,
  CommunityGoalsPolicy,
  _ContestWorker,
  _FarcasterWorker,
  _Xp,
  _NotificationsSettingsPolicy,
  _NotificationsPolicy,
  _ReactionWorker,
];
