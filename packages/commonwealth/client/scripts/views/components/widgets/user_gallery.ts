/* eslint-disable no-script-url */
import 'components/widgets/user_gallery.scss';

import m from 'mithril';

import type { Account, AddressInfo } from 'models';
import app from 'state';
import User, { AnonymousUser } from './user';

// The UserGallery does not perform uniqueness checks.
// The list of passed users must be unique to begin with, if one
// wishes to prevent redundant rendering of avatars.

const UserGallery: m.Component<
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

    return m('.UserGallery', { class: vnode.attrs.class }, [
      users
        .slice(0, Math.min(userCount, maxUsers))
        .map((user: Account | AddressInfo) => {
          if (
            user.chain.id !== app.chain?.id &&
            user.chain.id !== app.chain?.base
          ) {
            return m(AnonymousUser, {
              avatarOnly: true,
              avatarSize: 40,
              showAsDeleted: true,
              distinguishingKey: user.address.slice(user.address.length - 3),
            });
          } else {
            return m(User, {
              user,
              avatarOnly: true,
              popover,
              avatarSize,
            });
          }
        }),
      overflowUsers > 0 &&
        m(
          '.overflow-users-wrap',
          {
            style: `width: ${avatarSize}px; height: ${avatarSize}px; line-height: ${avatarSize}px;`,
          },
          [m('.overflow-users', `+${overflowUsers}`)]
        ),
    ]);
  },
};

export default UserGallery;
