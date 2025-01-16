import FrameSDK from '@farcaster/frame-sdk';
import { useCallback } from 'react';
import useFarcasterStore from 'state/ui/farcaster';

// Helper function to generate a valid Farcaster nonce
const generateNonce = (length = 32) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let nonce = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    nonce += charset[array[i] % charset.length];
  }
  return nonce;
};

export const useFarcasterSignIn = () => {
  const { setIsSigningIn, setSignInResult, setError } = useFarcasterStore();

  const signIn = useCallback(async () => {
    try {
      setIsSigningIn(true);
      setError(null);

      // Generate a valid alphanumeric nonce
      const nonce = generateNonce();

      // Current time and expiration (10 minutes from now)
      const now = new Date();
      const exp = new Date(now.getTime() + 10 * 60 * 1000);

      const result = await FrameSDK.actions.signIn({
        nonce,
        notBefore: now.toISOString(),
        expirationTime: exp.toISOString(),
      });

      setSignInResult(result);
      return result;
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
