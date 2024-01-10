import React, { useState } from 'react';

import $ from 'jquery';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { PageNotFound } from './404';
import { PageLoading } from './loading';

type ProfileRedirectProps = {
  address: string;
  scope: string;
};

const ProfileRedirect = (props: ProfileRedirectProps) => {
  const [profileId, setProfileId] = useState<number>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const navigate = useCommonNavigate();

  const getProfileId = async (addresses: string[], community: string[]) => {
    setLoading(true);
    try {
      const res = await $.post(`${app.serverUrl()}/getAddressProfile`, {
        addresses,
        chains: community,
      });
      if (res.status === 'Success' && res.result) {
        setProfileId(res.result[0].profileId);
      }
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageNotFound message="There was an error loading this profile." />;
  }

  let { address, scope } = props;
  if (!address) address = app.user.activeAccount?.address;
  if (!scope) scope = app.activeChainId();

  if (address && scope && !profileId) getProfileId([address], [scope]);

  if (profileId) {
    navigate(`/profile/id/${profileId}`, {}, null);
  }
};

export default ProfileRedirect;
