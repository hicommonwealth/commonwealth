import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import clsx from 'clsx';
import React from 'react';
import './ProfileCard.scss';

const ProfileCard = () => {
  const userData = useUserStore();

  const { data } = useFetchProfileByIdQuery({
    apiCallEnabled: userData.isLoggedIn,
  });

  const backgroundImageUrl = data?.profile?.background_image?.url || '';
  const backgroundBehavior =
    data?.profile?.background_image?.imageBehavior || 'cover';

  return (
    <div className="profile-card">
      <div
        className={clsx('background-cover', {
          'background-cover--cover': backgroundBehavior === 'cover',
          'background-cover--fill': backgroundBehavior === 'fill',
        })}
        style={{
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : undefined,
        }}
      ></div>
      <div className="profile-content">
        <img
          className="profile-image"
          src={data?.profile?.avatar_url ?? ''}
          alt="Profile"
        />
        <h3 className="profile-name">{data?.profile.name}</h3>
      </div>
    </div>
  );
};

export default ProfileCard;
