import { command } from '@hicommonwealth/core';
import {
  CANVAS_TOPIC,
  WalletId,
  getSessionSigners,
  serializeCanvas,
} from '@hicommonwealth/shared';
import { SignIn } from '../../src/aggregates/user';
import { verifyAddress } from '../../src/services/session';

export async function signIn(community_id: string, referrer_address?: string) {
  const [evmSigner] = await getSessionSigners();
  const { payload } = await evmSigner.newSession(CANVAS_TOPIC);
  const address = evmSigner.getAddressFromDid(payload.did);
  return await command(SignIn(), {
    actor: {
      address,
      user: {
        id: -1,
        email: '',
        auth: await verifyAddress(community_id, address),
      },
    },
    payload: {
      address,
      community_id,
      referrer_address,
      wallet_id: WalletId.Metamask,
      session: serializeCanvas(payload),
    },
  });
}
