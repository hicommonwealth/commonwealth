import { useEffect } from 'react';
import { useAuthModalStore } from 'state/ui/modals';
import { AuthModalType } from 'views/modals/AuthModal';

export const SignIn = () => {
  const { setAuthModalType } = useAuthModalStore();

  useEffect(() => {
    setAuthModalType(AuthModalType.SignIn);
  }, [setAuthModalType]);

  return null;
};
