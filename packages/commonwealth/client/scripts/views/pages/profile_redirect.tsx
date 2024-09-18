import React, { useState } from 'react';

import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';
import useUserStore from 'state/ui/user';
import { PageNotFound } from './404';
import { PageLoading } from './loading';

type ProfileRedirectProps = {
  address: string;
  scope: string;
};

const ProfileRedirect = (props: ProfileRedirectProps) => {
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const { address, scope } = props;
  const profileAddress = address || user.activeAccount?.address;
  const communityId = scope || app.activeChainId() || '';
  const {
    data: users,
    isError,
    isLoading,
  } = useFetchProfilesByAddressesQuery({
    profileChainIds: [communityId],
    profileAddresses: profileAddress ? [profileAddress] : [],
    currentChainId: communityId,
    apiCallEnabled: !!address && !!communityId,
  });

  useNecessaryEffect(() => {
    if (!isError && users && Array.isArray(users) && users[0]?.userId) {
      navigate(`/profile/id/${users[0].userId}`, {}, null);
    } else {
      setProfileNotFound(true);
    }
  }, [isError, users]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (isError) {
    return <PageNotFound message="There was an error loading this profile." />;
  }

  if (profileNotFound) {
    return <PageNotFound message="Profile not found" />;
  }
};

export default ProfileRedirect;
