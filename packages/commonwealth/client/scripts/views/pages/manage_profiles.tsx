import React from 'react';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';

import 'pages/manage_profiles.scss';

import app from 'state';
import { AddressInfo, NewProfile as Profile } from 'models';
import { CWText } from '../components/component_kit/cw_text';
import Sublayout from '../sublayout';
import ProfilePreview from '../components/profile_preview';
import { PageNotFound } from './404';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWButton } from '../components/component_kit/cw_button';

const ManageProfiles = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [profiles, setProfiles] = React.useState<Profile[]>();
  const [addresses, setAddresses] = React.useState<AddressInfo[]>();

  const getProfiles = async () => {
    setLoading(true);

    try {
      const response = await $.post(`${app.serverUrl()}/newProfiles`, {
        jwt: app.user.jwt,
      });

      setProfiles(response.result.profiles?.map(
        (profile) => new Profile(profile)
      ));
      setAddresses(response.result.addresses?.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address,
            a.profile_id
          )
      ));
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    getProfiles();
  }, []);

  if (loading)
    return (
      <div className="ManageProfiles full-height">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );

  if (error)
    return <PageNotFound message="We cannot find any profiles." />;

  if (!profiles) return;

  return (
    <Sublayout>
      <div className="ManageProfiles">
        <div className="title-container">
          <div>
            <CWText type="h3" className="title">
              Manage Profiles and Addresses
            </CWText>
            <CWText className="description">
              Create and edit profiles and manage your connected addresses.
            </CWText>
          </div>
          <CWButton
            label="Create Profile"
            iconLeft="plus"
            buttonType="mini-white"
            onClick={() => {
              setLoading(true);
              setTimeout(() => navigate('/profile/new'), 1000);
            }}
          />
        </div>
        {profiles.map((profile, i) => (
          <ProfilePreview
            key={i}
            profiles={profiles}
            profile={profile}
            addresses={addresses?.filter(
              (a) => a.profileId === profile.id
            )}
            refreshProfiles={getProfiles}
          />
        ))}
      </div>
    </Sublayout>
  );
}

export default ManageProfiles;
