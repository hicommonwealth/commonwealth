import React from 'react';

import 'components/user/user.scss';

import { Avatar } from 'views/components/Avatar';
import { Skeleton } from '../Skeleton';
import type { UserAttrs } from './user.types';

export const UserSkeleton = ({
  shouldShowAvatarOnly,
  shouldHideAvatar,
  shouldShowPopover,
  avatarSize: size,
}: Partial<UserAttrs>) => {
  const avatarSize = size || 16;

  // just return the avatar only
  if (shouldShowAvatarOnly) {
    return (
      <div className="User avatar-only">
        <Avatar url={''} size={16} address={0} showSkeleton />
      </div>
    );
  }

  // base user info
  const userInfo = (
    <div className="User">
      {!shouldHideAvatar && (
        <Avatar url={''} size={avatarSize} address={0} showSkeleton={true} />
      )}
      <div className="user-display-name username ml-8">
        <Skeleton width={'80px'} />
      </div>
    </div>
  );

  // with popover wrapper
  if (shouldShowPopover) {
    return <div className="user-popover-wrapper">{userInfo}</div>;
  }

  // without popover wrapper
  return userInfo;
};
