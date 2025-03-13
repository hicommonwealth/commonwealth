import { RoutingKeyTags } from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  Contest,
  ContestWorker,
  CreateUnverifiedUser,
  DiscordBotPolicy,
  EventStreamPolicy,
  FarcasterWorker,
  NotificationsPolicy,
  User,
} from '@hicommonwealth/model';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

export const rascalConsumerMap = [
  ChainEventPolicy,
  DiscordBotPolicy,
  Contest.Contests,
  FarcasterWorker,
  EventStreamPolicy,
  NotificationsSettingsPolicy,
  CreateUnverifiedUser,
  {
    consumer: ContestWorker,
    overrides: {
      ThreadCreated: `ThreadCreated.${RoutingKeyTags.Contest}.#`,
      ThreadUpvoted: `ThreadUpvoted.${RoutingKeyTags.Contest}.#`,
    },
  },
  {
    consumer: User.Xp,
    overrides: {
      ThreadCreated: `ThreadCreated.#`,
      ThreadUpvoted: `ThreadUpvoted.#`,
    },
  },
  {
    consumer: NotificationsPolicy,
    overrides: {
      ThreadCreated: null,
      ThreadUpvoted: `ThreadUpvoted.#`,
    },
  },
];
