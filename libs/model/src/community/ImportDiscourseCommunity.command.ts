import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { emitEvent } from '../utils';

export function ImportDiscourseCommunity(): Command<
  typeof schemas.ImportDiscourseCommunity
> {
  return {
    ...schemas.ImportDiscourseCommunity,
    secure: false, // TODO: remove this
    auth: [], // TODO: add super admin middleware
    body: async ({ payload }) => {
      await emitEvent(models.Outbox, [
        {
          event_name: EventNames.DiscourseImportSubmitted,
          event_payload: {
            id: payload.id,
            base: payload.base,
            accountsClaimable: payload.accountsClaimable,
            dumpUrl: payload.dumpUrl,
          },
        },
      ]);
    },
  };
}
