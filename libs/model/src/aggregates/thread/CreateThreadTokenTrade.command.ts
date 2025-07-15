import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { createTradeHandler } from '../token';

export function CreateThreadTokenTrade(): Command<
  typeof schemas.CreateLaunchpadTrade
> {
  return {
    ...schemas.CreateLaunchpadTrade,
    auth: [],
    body: createTradeHandler(true),
  };
}
