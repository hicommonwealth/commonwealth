import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function ChainEventCreated(): Command<typeof schemas.ChainEventCreated> {
  return {
    ...schemas.ChainEventCreated,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      console.log('>>>>>>>', payload.event.data.block.logs[0]);
      return {};
    },
  };
}
