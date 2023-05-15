import React from 'react';

import { render } from 'helpers/DEPRECATED_ReactRender';
import jdenticon from 'jdenticon';

import 'components/user/user.scss';

type AnonymousUserProps = {
  avatarOnly?: boolean;
  avatarSize?: number;
  distinguishingKey: string; // To distinguish user from other anonymous users
  hideAvatar?: boolean;
  showAsDeleted?: boolean;
};

export const AnonymousUser = (props: AnonymousUserProps) => {
  const {
    avatarOnly,
    avatarSize,
    distinguishingKey,
    hideAvatar,
    showAsDeleted,
  } = props;

  const showAvatar = !hideAvatar;

  let profileAvatar;

  if (showAvatar) {
    const pseudoAddress = distinguishingKey;

    profileAvatar = render('svg.Jdenticon', {
      style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
      'data-address': pseudoAddress,
      oncreate: (vnode_) => {
        jdenticon.update(vnode_.dom as HTMLElement, pseudoAddress);
      },
      onupdate: (vnode_) => {
        jdenticon.update(vnode_.dom as HTMLElement, pseudoAddress);
      },
    });
  }

  return avatarOnly ? (
    <div className="User avatar-only" key="-">
      <div
        className="user-avatar-only"
        style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
      >
        {profileAvatar}
      </div>
    </div>
  ) : (
    <div className="User" key="-">
      {showAvatar && (
        <div
          className="user-avatar-only"
          style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
        >
          {profileAvatar}
        </div>
      )}
      <a className="user-display-name username">
        {showAsDeleted ? 'Deleted' : 'Anonymous'}
      </a>
    </div>
  );
};
