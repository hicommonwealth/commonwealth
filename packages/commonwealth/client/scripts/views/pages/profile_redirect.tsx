import React from 'react';

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

  if (isLoading) {
    return <PageLoading />;
  }

  if (isError) {
    return <PageNotFound message="There was an error loading this profile." />;
  }

  if (!isError && users && users[0].id) {
    navigate(`/profile/id/${users[0].id}`, {}, null);
  }
};

export default ProfileRedirect;
