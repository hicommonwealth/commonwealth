import { useEffect } from 'react';
import { matchRoutes, useSearchParams } from 'react-router-dom';
import { setLocalStorageRefcode } from '../helpers/localStorage';
import app from '../state';
import { useAuthModalStore } from '../state/ui/modals';
import { useUserStore } from '../state/ui/user/user';
// import useJoinCommunity from '../views/components/SublayoutHeader/useJoinCommunity';
import { AuthModalType } from '../views/modals/AuthModal';

export const useHandleInviteLink = ({
  isInsideCommunity,
}: {
  isInsideCommunity?: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setAuthModalType, authModalType } = useAuthModalStore();
  const user = useUserStore();
  // const { handleJoinCommunity } = useJoinCommunity();
  const refcode = searchParams.get('refcode');

  const generalInviteRoute = matchRoutes(
    [{ path: '/dashboard/global' }],
    location,
  );
  const communityInviteRoute =
    matchRoutes([{ path: '/:scope' }], location) && isInsideCommunity;

  const activeChainId = app.activeChainId();

  useEffect(() => {
    if (!refcode) {
      return;
    }

    if (user.isLoggedIn) {
      if (generalInviteRoute) {
        // do nothing
      } else if (communityInviteRoute) {
        if (!activeChainId) {
          return;
        }
        setLocalStorageRefcode(refcode);
        console.log('handleJoinCommunity');
        // handleJoinCommunity();
        console.log('handleJoinCommunity done');
        // check if I joined community
        // if not - join community automatically (OR display modal to join community)
      }
    } else {
      if (generalInviteRoute) {
        // do nothing
        setLocalStorageRefcode(refcode);
      } else if (communityInviteRoute) {
        if (!activeChainId) {
          console.log('No active chain id');
          return;
        }
        setLocalStorageRefcode(refcode);
        console.log('Active chain id', activeChainId);
        // check if I joined community
        // if not - join community automatically (OR display modal to join community)
      }

      searchParams.delete('refcode');
      setSearchParams(searchParams);
      setAuthModalType(AuthModalType.CreateAccount);
    }
  }, [
    authModalType,
    searchParams,
    user.isLoggedIn,
    setAuthModalType,
    generalInviteRoute,
    communityInviteRoute,
    activeChainId,
    refcode,
    setSearchParams,
  ]);
};
