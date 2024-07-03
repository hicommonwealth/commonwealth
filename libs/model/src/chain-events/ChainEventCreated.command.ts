import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function ChainEventCreated(): Command<any> {
  return {
    ...schemas.ChainEventCreated,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      console.log('>>>>>>>', payload);
    },
  };
}
