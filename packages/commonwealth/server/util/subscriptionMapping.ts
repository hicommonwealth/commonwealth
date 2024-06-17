import { logger } from '@hicommonwealth/core';
import { NotificationCategories } from '@hicommonwealth/shared';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export function supportedSubscriptionCategories(): string[] {
  return [
    NotificationCategories.NewMention,
    NotificationCategories.NewCollaboration,
    NotificationCategories.NewThread,
    NotificationCategories.NewComment,
    NotificationCategories.NewReaction,
    NotificationCategories.ChainEvent,
    NotificationCategories.SnapshotProposal,
  ];
}
