import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import clsx from 'clsx';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// removed tooltip hover for profile name
import TrustLevelRole from '../../TrustLevelRole';

import './ProfileCard.scss';

enum ImageBehavior {
  Cover = 'cover',
  Fill = 'fill',
}

const ProfileCard = () => {
  const userData = useUserStore();
  const navigate = useNavigate();

  const { data } = useFetchProfileByIdQuery({
    apiCallEnabled: userData.isLoggedIn,
  });

  const backgroundImageUrl = data?.profile?.background_image?.url || '';
  const backgroundBehavior =
    data?.profile?.background_image?.imageBehavior || ImageBehavior.Fill;

  if (!data) return null;

  return (
    <div className="ProfileCard">
      <Link to={`/profile/id/${userData.id}`} className="user-info">
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
      </Link>

      <div className="profile-content">
        <Link to={`/profile/id/${userData.id}`} className="user-info">
          <img
            className="profile-image"
            src={data?.profile?.avatar_url ?? ''}
            alt="Profile"
          />
        </Link>
        <div className="user-info">
          <Link to={`/profile/id/${userData.id}`}>
            <h3 className="profile-name">{data?.profile.name}</h3>
          </Link>
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/profile/edit');
            }}
          >
            <TrustLevelRole type="user" level={data?.tier} withTooltip />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
