import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function FarcasterAction(): Query<typeof schemas.FarcasterAction> {
  return {
    ...schemas.FarcasterAction,
    auth: [],
    secure: false,
    body: async ({ payload }) => {},
  };
}
