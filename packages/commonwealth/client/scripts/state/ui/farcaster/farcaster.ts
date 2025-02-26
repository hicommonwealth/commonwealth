import { SIWFSigner } from '@canvas-js/chain-ethereum';
import type { Context } from '@farcaster/frame-sdk';
import FrameSDK from '@farcaster/frame-sdk';
import { contractTopic } from '@hicommonwealth/shared';
import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type SignInResult = {
  message: string;
  signature: string;
};

interface FarcasterStore {
  farcasterContext: Context.FrameContext | null;
  setFarcasterFrameContext: (context: Context.FrameContext) => void;
  signInToFarcasterFrame: () => Promise<{
    result: SignInResult;
    privateKey: Uint8Array;
  }>;
}

export const farcasterStore = createStore<FarcasterStore>()(
  devtools((set) => ({
    farcasterContext: null,
    setFarcasterFrameContext: (context) => set({ farcasterContext: context }),
    signInToFarcasterFrame: async () => {
      // Generate a valid alphanumeric nonce
      const { nonce, privateKey } =
        SIWFSigner.newSIWFRequestNonce(contractTopic);

      // Current time and expiration (10 minutes from now)
      const now = new Date();
      const exp = new Date(now.getTime() + 10 * 60 * 1000);

      const result = await FrameSDK.actions.signIn({
        nonce,
        notBefore: now.toISOString(),
        expirationTime: exp.toISOString(),
      });

      return { result, privateKey };
    },
  })),
);

const useFarcasterStore = createBoundedUseStore(farcasterStore);

export default useFarcasterStore;
