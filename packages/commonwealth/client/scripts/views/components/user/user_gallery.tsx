import React from 'react';

import 'components/user/user_gallery.scss';

import app from 'state';
import Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import { User } from './user';

type UserGalleryProps = {
  addressesCount?: number;
  avatarSize: number;
  class?: string;
  maxUsers?: number;
  popover?: boolean;
  users: Array<Account> | Array<AddressInfo>;
};

// The UserGallery does not perform uniqueness checks.
// The list of passed users must be unique to begin with, if one
// wishes to prevent redundant rendering of avatars.

export const UserGallery = (props: UserGalleryProps) => {
  const { users, avatarSize, popover, addressesCount, maxUsers = 10 } = props;

  const userCount = users.length;

  const overflowUsers =
    addressesCount || (userCount < maxUsers ? 0 : userCount - maxUsers);

  return (
    <div className="UserGallery">
      {users
        .slice(0, Math.min(userCount, maxUsers))
        .map((user: Account | AddressInfo) => {
          return (
            <User
              user={user}
              avatarOnly
              showAsDeleted
              popover={popover}
              avatarSize={avatarSize}
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
