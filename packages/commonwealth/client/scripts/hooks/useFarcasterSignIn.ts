import { SIWFSigner } from '@canvas-js/chain-ethereum';
import FrameSDK from '@farcaster/frame-sdk';
import { contractTopic } from '@hicommonwealth/shared';
import { useCallback } from 'react';
import useFarcasterStore from 'state/ui/farcaster';

export const useFarcasterSignIn = () => {
  const { setIsSigningIn, setSignInResult, setError } = useFarcasterStore();

  const signIn = useCallback(async () => {
    try {
      setIsSigningIn(true);
      setError(null);

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

      setSignInResult(result);
      return { result, privateKey };
    } catch (error) {
      if (error.name === 'SignIn.RejectedByUser') {
        setError('Sign in was rejected by user');
      } else {
        setError(error.message || 'Failed to sign in with Farcaster');
      }
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [setIsSigningIn, setSignInResult, setError]);

  return { signIn };
};
