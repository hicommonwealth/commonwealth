import type { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function FarcasterCastReplyWebhook(): Command<
  typeof schemas.FarcasterCastReplyWebhook
> {
  return {
    ...schemas.FarcasterCastReplyWebhook,
    secure: false,
    auth: [],
    body: async ({ payload }) => {},
  };
}
