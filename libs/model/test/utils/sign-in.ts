import { SIWESigner } from '@canvas-js/chain-ethereum';
import { command } from '@hicommonwealth/core';
import { generateWallet } from '@hicommonwealth/evm-protocols';
import {
  CANVAS_TOPIC,
  WalletId,
  serializeCanvas,
} from '@hicommonwealth/shared';
import { SignIn } from '../../src/aggregates/user';
import { verifyAddress } from '../../src/services/session';

export async function createSIWESigner(ethChainId?: number) {
  const wallet = generateWallet();
  return new SIWESigner({
    signer: {
      getAddress: () => Promise.resolve(wallet.address),
      signMessage: (message: string) =>
        Promise.resolve(wallet.signMessage({ message })),
    },
    chainId: ethChainId,
  });
}

export async function signIn(
  evmSigner: SIWESigner,
  community_id: string,
  user_id = -1,
  referrer_address?: string,
  wallet_id?: WalletId,
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
      wallet_id: wallet_id || WalletId.Metamask,
      session: serializeCanvas(payload),
    },
  });
}
