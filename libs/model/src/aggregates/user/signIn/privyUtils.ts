import { logger } from '@hicommonwealth/core';
import { PrivyClient } from '@privy-io/server-auth';
import { config } from '../../../config';

const log = logger(import.meta);

// NOTE: this file is separate from privy.ts for mocking purposes
// i.e. we can import these functions and mock them before importing
//  from privy.ts

export const privyClient = new PrivyClient(
  config.PRIVY.APP_ID!,
  config.PRIVY.APP_SECRET!,
);

export async function getPrivyUserById(id: string) {
  const user = await privyClient.getUserById(id);
  log.trace(`getPrivyUserById: ${JSON.stringify(user, null, 2)}`);
  return user;
}

export async function getPrivyUserByIdToken(idToken: string) {
  const user = await privyClient.getUser({ idToken });
  log.trace(`getPrivyUserByIdToken: ${JSON.stringify(user, null, 2)}`);
  return user;
}
