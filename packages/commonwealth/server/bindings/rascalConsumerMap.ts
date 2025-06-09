import { buildRetryStrategy } from '@hicommonwealth/adapters';
import { Consumer, RoutingKeyTags, stats } from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  CommunityGoalsPolicy,
  CommunityIndexerWorker,
  Contest,
  ContestWorker,
  CreateUnverifiedUser,
  DiscordBotPolicy,
  EventStreamPolicy,
  FarcasterWorker,
  LaunchpadPolicy,
  NominationsWorker,
  NotificationsPolicy,
  TwitterEngagementPolicy,
  User,
} from '@hicommonwealth/model';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

export const rascalConsumerMap: Consumer[] = [
  ChainEventPolicy,
  DiscordBotPolicy,
  Contest.Contests,
  NominationsWorker,
  FarcasterWorker,
  EventStreamPolicy,
  NotificationsSettingsPolicy,
  CommunityIndexerWorker,
  CreateUnverifiedUser,
  TwitterEngagementPolicy,
  CommunityGoalsPolicy,
  LaunchpadPolicy,
  {
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
  },
  {
    consumer: FarcasterWorker,
    retryStrategy: buildRetryStrategy(undefined, 20_000),
    overrides: {},
  },
  {
    consumer: User.Xp,
    overrides: {
      ThreadCreated: `ThreadCreated.#`,
      ThreadUpvoted: `ThreadUpvoted.#`,
    },
  },
  {
    consumer: NotificationsSettingsPolicy,
    worker: 'knock',
    overrides: {},
  },
  {
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
  },
];
