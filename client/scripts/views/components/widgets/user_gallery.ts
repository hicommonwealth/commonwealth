/* eslint-disable no-script-url */
import 'components/widgets/user_gallery.scss';

import m from 'mithril';
import _ from 'lodash';

import { Account, AddressInfo, ChainInfo, ChainBase } from 'models';
import User from './user';

// The UserGallery does not perform uniqueness checks.
// The list of passed users must be unique to begin with, if one
// wishes to prevent redundant rendering of avatars.

const UserGallery: m.Component<{
  users: Account<any>[] | AddressInfo[];
  class?: string;
  avatarSize: number;
  popover?: boolean;
  maxUsers?: number;
}, {}> = {
  view: (vnode) => {
    const { users, avatarSize, popover } = vnode.attrs;
    const userCount = users.length;
    const maxUsers = vnode.attrs.maxUsers || 10;
    const overflowUsers = (userCount < maxUsers) ? 0 : (userCount - maxUsers);

    return m('.UserGallery', { class: vnode.attrs.class }, [
      (users as any)
        .slice(0, Math.min(userCount, maxUsers))
        .map((user) => m(User, {
          user,
          avatarOnly: true,
          popover,
          avatarSize,
        })),
      overflowUsers > 0
        && m('.overflow-users-wrap', {
          style: `width: ${avatarSize}px; height: ${avatarSize}px; line-height: ${avatarSize}px;`
        }, [
          m('.overflow-users', `+${overflowUsers}`)
        ])
    ]);
  }
};

export default UserGallery;
