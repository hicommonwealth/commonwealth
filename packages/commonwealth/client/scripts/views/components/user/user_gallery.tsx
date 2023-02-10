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

import 'components/user/user_gallery.scss';

import { Account, AddressInfo } from 'models';
import app from 'state';
import { User } from './user';
import { AnonymousUser } from './anonymous_user';

type UserGalleryAttrs = {
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

export class UserGallery extends ClassComponent<UserGalleryAttrs> {
  view(vnode: ResultNode<UserGalleryAttrs>) {
    const { users, avatarSize, popover, addressesCount } = vnode.attrs;

    const userCount = users.length;

    const maxUsers = vnode.attrs.maxUsers || 10;

    const overflowUsers =
      addressesCount || (userCount < maxUsers ? 0 : userCount - maxUsers);

    return (
      <div className="UserGallery">
        {users
          .slice(0, Math.min(userCount, maxUsers))
          .map((user: Account | AddressInfo) => {
            if (
              user.chain.id !== app.chain?.id &&
              user.chain.id !== app.chain?.base
            ) {
              return (
                <AnonymousUser
                  avatarOnly
                  avatarSize={40}
                  showAsDeleted
                  distinguishingKey={user.address.slice(
                    user.address.length - 3
                  )}
                />
              );
            } else {
              return (
                <User
                  user={user}
                  avatarOnly
                  popover={popover}
                  avatarSize={avatarSize}
                />
              );
            }
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
  }
}
