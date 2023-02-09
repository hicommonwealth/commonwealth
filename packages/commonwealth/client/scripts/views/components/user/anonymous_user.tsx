import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
} from 'mithrilInterop';
import jdenticon from 'jdenticon';

import 'components/user/user.scss';

type AnonymousUserAttrs = {
  avatarOnly?: boolean;
  avatarSize?: number;
  distinguishingKey: string; // To distinguish user from other anonymous users
  hideAvatar?: boolean;
  showAsDeleted?: boolean;
};

export class AnonymousUser extends ClassComponent<AnonymousUserAttrs> {
  view(vnode: ResultNode<AnonymousUserAttrs>) {
    const {
      avatarOnly,
      avatarSize,
      distinguishingKey,
      hideAvatar,
      showAsDeleted,
    } = vnode.attrs;

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
  }
}
