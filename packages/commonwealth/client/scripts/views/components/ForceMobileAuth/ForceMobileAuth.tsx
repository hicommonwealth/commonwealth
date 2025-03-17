import { isMobileApp } from 'hooks/useReactNativeWebView';
import { memo, ReactNode, useCallback, useEffect } from 'react';
import useUserStore from 'state/ui/user';

type ForceMobileAuthProps = {
  children: ReactNode;
};

/**
 * Force the mobile app to ALWAYS login.
 *
 * Ideally we would do this within react-native/expo but due to issues with the
 * expo-router this isn't possible.
 *
 * It's much easier to do this on the frontend.
 */
export const ForceMobileAuth = memo(function ForceMobileAuth(
  props: ForceMobileAuthProps,
) {
  const { children } = props;

  const user = useUserStore();

  const requiresMobileAuth = useCallback(() => {
    if (!isMobileApp()) {
      // do not require this in the default webapp.
      return false;
    }

    if (user.id !== 0) {
      // if the user is logged in, then we are ok
      return false;
    }

    if (location.pathname.startsWith('/mobile-signin')) {
      // we're on the mobile auth page so we're good to go.
      return false;
    }

    return true;
  }, [user.id]);

  useEffect(() => {
    if (requiresMobileAuth()) {
      location.href = '/mobile-signin';
    }
  }, [requiresMobileAuth]);

  if (requiresMobileAuth()) {
    return null;
  } else {
    return children;
  }
});
