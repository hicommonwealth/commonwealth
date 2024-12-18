import { useCallback, useEffect } from 'react';
import { matchRoutes, useSearchParams } from 'react-router-dom';
import {
  LocalStorageKeys,
  REFCODE_EXPIRATION_MS,
  setLocalStorageItem,
} from '../helpers/localStorage';
import app from '../state';
import { useAuthModalStore } from '../state/ui/modals';
import { useUserStore } from '../state/ui/user/user';
import { AuthModalType } from '../views/modals/AuthModal';

export const useHandleInviteLink = ({
  isInsideCommunity,
  handleJoinCommunity,
}: {
  isInsideCommunity?: boolean;
  handleJoinCommunity: () => Promise<boolean | undefined>;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const refcode = searchParams.get('refcode');

  const { setAuthModalType, authModalType } = useAuthModalStore();
  const user = useUserStore();
  const activeChainId = app.activeChainId();

  const generalInviteRoute = matchRoutes(
    [{ path: '/dashboard/global' }],
    location,
  );

  const communityInviteRoute =
    matchRoutes(
      [{ path: '/:scope' }, { path: '/:scope/discussions/*' }],
      location,
    ) && isInsideCommunity;

  const removeRefcodeFromUrl = useCallback(() => {
    searchParams.delete('refcode');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!refcode) {
      return;
    }

    if (user.isLoggedIn) {
      if (generalInviteRoute) {
        // do nothing
        removeRefcodeFromUrl();
      } else if (communityInviteRoute) {
        if (!activeChainId) {
          return;
        }

        setLocalStorageItem(
          LocalStorageKeys.ReferralCode,
          refcode,
          REFCODE_EXPIRATION_MS,
        );
        removeRefcodeFromUrl();
        handleJoinCommunity().catch(console.error);
      }
    } else {
      if (generalInviteRoute) {
        setLocalStorageItem(
          LocalStorageKeys.ReferralCode,
          refcode,
          REFCODE_EXPIRATION_MS,
        );
      } else if (communityInviteRoute) {
        if (!activeChainId) {
          return;
        }

        setLocalStorageItem(
          LocalStorageKeys.ReferralCode,
          refcode,
          REFCODE_EXPIRATION_MS,
        );
      }

      removeRefcodeFromUrl();
      setAuthModalType(AuthModalType.CreateAccount);
    }
  }, [
    handleJoinCommunity,
    authModalType,
    searchParams,
    user.isLoggedIn,
    setAuthModalType,
    generalInviteRoute,
    communityInviteRoute,
    activeChainId,
    refcode,
    setSearchParams,
    removeRefcodeFromUrl,
  ]);
};
