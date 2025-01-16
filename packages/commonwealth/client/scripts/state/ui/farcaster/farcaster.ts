import { SignInResult } from '@farcaster/frame-sdk';
import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface FarcasterStore {
  farcasterContext: any | null;
  signInResult: SignInResult | null;
  isSigningIn: boolean;
  error: string | null;
  setFarcasterContext: (context: any) => void;
  setSignInResult: (result: SignInResult | null) => void;
  setIsSigningIn: (isSigningIn: boolean) => void;
  setError: (error: string | null) => void;
}

export const farcasterStore = createStore<FarcasterStore>()(
  devtools((set) => ({
    farcasterContext: null,
    signInResult: null,
    isSigningIn: false,
    error: null,
    setFarcasterContext: (context) => set({ farcasterContext: context }),
    setSignInResult: (result) => set({ signInResult: result }),
    setIsSigningIn: (isSigningIn) => set({ isSigningIn }),
    setError: (error) => set({ error }),
  })),
);

const useFarcasterStore = createBoundedUseStore(farcasterStore);

export default useFarcasterStore;
