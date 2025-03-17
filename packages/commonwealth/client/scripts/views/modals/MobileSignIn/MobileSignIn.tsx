import { useCommonNavigate } from 'navigation/helpers';
import { useEffect } from 'react';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { AuthModalType } from 'views/modals/AuthModal';

/**
 * This is a very basic component to JUST trigger the auth dialog in the mobile
 * app.
 *
 * It will load the default app if you're already logged in though.
 */
export const MobileSignIn = () => {
  const { setAuthModalType } = useAuthModalStore();
  const user = useUserStore();
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (user.isLoggedIn) {
      console.log('Logged in, redirecting to home');
      navigate('/');
      return;
    }

    setAuthModalType(AuthModalType.SignIn);
  }, [setAuthModalType, navigate, user.isLoggedIn]);

  return null;
};
