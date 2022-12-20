/* eslint-disable no-script-url */
import 'components/widgets/user_gallery.scss';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';
import _ from 'lodash';

import { Account, AddressInfo } from 'models';
import app from 'state';
import User, { AnonymousUser } from './user';

// The UserGallery does not perform uniqueness checks.
// The list of passed users must be unique to begin with, if one
// wishes to prevent redundant rendering of avatars.

const UserGallery: Component<
  {
    users: Account[] | AddressInfo[];
    addressesCount?: number;
    class?: string;
    avatarSize: number;
    popover?: boolean;
    maxUsers?: number;
  },
  {}
> = {
  view: (vnode) => {
    const { users, avatarSize, popover, addressesCount } = vnode.attrs;
    const userCount = users.length;
    const maxUsers = vnode.attrs.maxUsers || 10;
    const overflowUsers =
      addressesCount || (userCount < maxUsers ? 0 : userCount - maxUsers);

    return render('.UserGallery', { class: vnode.attrs.class }, [
      (users).slice(0, Math.min(userCount, maxUsers))
        .map((user: Account | AddressInfo) => {
          if (user.chain.id !== app.chain?.id && user.chain.id !== app.chain?.base) {
            return render(AnonymousUser, {
              avatarOnly: true,
              avatarSize: 40,
              showAsDeleted: true,
              distinguishingKey: user.address.slice(user.address.length - 3),
            });
          } else {
          return render(User, {
            user,
            avatarOnly: true,
            popover,
            avatarSize,
          });
        }}),
      overflowUsers > 0 &&
        render(
          '.overflow-users-wrap',
          {
            style: `width: ${avatarSize}px; height: ${avatarSize}px; line-height: ${avatarSize}px;`,
          },
          [render('.overflow-users', `+${overflowUsers}`)]
        ),
    ]);
  },
};

export default UserGallery;
