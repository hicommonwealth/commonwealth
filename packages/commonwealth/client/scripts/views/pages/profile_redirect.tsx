import React, { useState } from 'react';

import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';
import { PageNotFound } from './404';
import { PageLoading } from './loading';

type ProfileRedirectProps = {
  address: string;
  scope: string;
};

const ProfileRedirect = (props: ProfileRedirectProps) => {
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);
  const navigate = useCommonNavigate();

  const { address, scope } = props;
  const communityId = scope || app.activeChainId();
  const {
    data: users,
    isError,
    isLoading,
  } = useFetchProfilesByAddressesQuery({
    profileChainIds: [communityId],
    profileAddresses: [address || app.user.activeAccount?.address],
    currentChainId: communityId,
    apiCallEnabled: !!address && !!communityId,
  });

  useNecessaryEffect(() => {
    if (!isError && users && Array.isArray(users) && users[0]?.id) {
      navigate(`/profile/id/${users[0].id}`, {}, null);
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
