import { useEffect } from 'react';
import { useAuthModalStore } from 'state/ui/modals';
import { AuthModalType } from 'views/modals/AuthModal';

/**
 * This is a very basic component to JUST trigger the auth dialog in the mobile
 * app.
 */
export const MobileSignIn = () => {
  const { setAuthModalType } = useAuthModalStore();

  useEffect(() => {
    setAuthModalType(AuthModalType.SignIn);
  }, [setAuthModalType]);

  return null;
};
