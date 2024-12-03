import React from 'react';
import { User } from './user';
import './user_gallery.scss';

type UserGalleryProps = {
  addressesCount?: number;
  avatarSize: number;
  class?: string;
  maxUsers?: number;
  popover?: boolean;
  users: { address: string; communityId: string }[];
};

// The UserGallery does not perform uniqueness checks.
// The list of passed users must be unique to begin with, if one
// wishes to prevent redundant rendering of avatars.

export const UserGallery = ({
  users,
  avatarSize,
  popover,
  addressesCount,
  maxUsers = 10,
}: UserGalleryProps) => {
  const userCount = users.length;

  const overflowUsers =
    addressesCount || (userCount < maxUsers ? 0 : userCount - maxUsers);

  return (
    <div className="UserGallery">
      {users.slice(0, Math.min(userCount, maxUsers)).map((user, index) => {
        return (
          <User
            userAddress={user.address}
            userCommunityId={user.communityId}
            shouldShowAvatarOnly
            shouldShowAsDeleted
            shouldShowPopover={popover}
            avatarSize={avatarSize}
            key={index}
          />
        );
      })}
      {overflowUsers > 0 && (
        <div
          className="overflow-users-wrap"
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            lineHeight: `${avatarSize}px;`,
          }}
        >
          <div className="overflow-users">+{overflowUsers}</div>
        </div>
      )}
    </div>
  );
};
