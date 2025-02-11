import { RoutingKeyTags } from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  FarcasterWorker,
  NotificationsPolicy,
  User,
} from '@hicommonwealth/model';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

export const rascalConsumerMap = [
  ChainEventPolicy,
  DiscordBotPolicy,
  Contest.Contests,
  User.UserReferrals,
  FarcasterWorker,
  NotificationsSettingsPolicy,
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
