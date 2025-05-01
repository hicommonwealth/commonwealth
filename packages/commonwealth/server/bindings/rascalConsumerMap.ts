import { RoutingKeyTags } from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  CommunityGoalsPolicy,
  Contest,
  ContestWorker,
  CreateUnverifiedUser,
  DiscordBotPolicy,
  FarcasterWorker,
  LaunchpadPolicy,
  NominationsWorker,
  NotificationsPolicy,
  TwitterEngagementPolicy,
  User,
} from '@hicommonwealth/model';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

export const rascalConsumerMap = [
  ChainEventPolicy,
  DiscordBotPolicy,
  Contest.Contests,
  NominationsWorker,
  FarcasterWorker,
  NotificationsSettingsPolicy,
  CreateUnverifiedUser,
  TwitterEngagementPolicy,
  CommunityGoalsPolicy,
  LaunchpadPolicy,
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
