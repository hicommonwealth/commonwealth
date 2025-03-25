import { config } from '@hicommonwealth/model';
import { PrivyClient } from '@privy-io/server-auth';

// NOTE: this file is separate from privy.ts for mocking purposes
// i.e. we can import these functions and mock them before importing
//  from privy.ts

export const privyClient = new PrivyClient(
  config.PRIVY.APP_ID!,
  config.PRIVY.APP_SECRET!,
);

export async function getPrivyUserById(id: string) {
  const user = await privyClient.getUserById(id);
  console.log(`getPrivyUserById: ${JSON.stringify(user, null, 2)}`);
  return user;
}

export async function getPrivyUserByIdToken(idToken: string) {
  const user = await privyClient.getUser({ idToken });
  console.log(`getPrivyUserByIdToken: ${JSON.stringify(user, null, 2)}`);
  return user;
}
