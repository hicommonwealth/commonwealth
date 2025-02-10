import { RoutingKeyTags } from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  FarcasterWorker,
  MomBotPolicy,
  NotificationsPolicy,
  User,
} from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

export const rascalConsumerMap = [
  ChainEventPolicy,
  DiscordBotPolicy,
  Contest.Contests,
  User.UserReferrals,
  FarcasterWorker,
  NotificationsSettingsPolicy,
  MomBotPolicy,
  {
    consumer: ContestWorker,
    overrides: {
      ThreadCreated: `${EventNames.ThreadCreated}.${RoutingKeyTags.Contest}.#`,
      ThreadUpvoted: `${EventNames.ThreadUpvoted}.${RoutingKeyTags.Contest}.#`,
    },
  },
  {
    consumer: User.Xp,
    overrides: {
      ThreadCreated: `${EventNames.ThreadCreated}.#`,
      ThreadUpvoted: `${EventNames.ThreadUpvoted}.#`,
    },
  },
  {
    consumer: NotificationsPolicy,
    overrides: {
      ThreadCreated: null,
      ThreadUpvoted: `${EventNames.ThreadUpvoted}.#`,
    },
  },
];
