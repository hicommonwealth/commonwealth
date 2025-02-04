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
import { EventNames } from '@hicommonwealth/schemas';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

export const rascalConsumerMap = [
  {
    consumer: ChainEventPolicy,
  },
  {
    consumer: DiscordBotPolicy,
  },
  {
    consumer: ContestWorker,
    overrides: {
      ThreadCreated: `${EventNames.ThreadCreated}.${RoutingKeyTags.Contest}.#`,
      ThreadUpvoted: `${EventNames.ThreadUpvoted}.${RoutingKeyTags.Contest}.#`,
      ContestRolloverTimerTicked: null,
    },
  },
  {
    consumer: Contest.Contests,
  },
  {
    consumer: User.Xp,
    overrides: {
      ThreadCreated: `${EventNames.ThreadCreated}.#`,
      ThreadUpvoted: `${EventNames.ThreadUpvoted}.#`,
    },
  },
  {
    consumer: User.UserReferrals,
  },
  {
    consumer: FarcasterWorker,
  },
  {
    consumer: NotificationsPolicy,
    overrides: {
      ThreadCreated: null,
      ThreadUpvoted: `${EventNames.ThreadUpvoted}.#`,
    },
  },
  {
    consumer: NotificationsSettingsPolicy,
  },
];
