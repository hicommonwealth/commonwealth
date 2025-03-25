import { SIWESigner } from '@canvas-js/chain-ethereum';
import { command } from '@hicommonwealth/core';
import {
  CANVAS_TOPIC,
  WalletId,
  serializeCanvas,
} from '@hicommonwealth/shared';
import { SignIn } from '../../src/aggregates/user';
import { verifyAddress } from '../../src/services/session';

export async function signIn(
  evmSigner: SIWESigner,
  community_id: string,
  user_id = -1,
  referrer_address?: string,
) {
  const { payload } = await evmSigner.newSession(CANVAS_TOPIC);
  const address = evmSigner.getAddressFromDid(payload.did);
  return await command(SignIn(), {
    actor: {
      address,
      user: {
        id: user_id,
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
