/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import _ from 'lodash';

import { Account, AddressInfo, ChainInfo, ChainBase } from 'models';
import User from './user';

const UserGallery: m.Component<{
  users: Account<any>[] | AddressInfo[];
  class?: string;
  avatarSize?: number;
  tooltip?: boolean;
}, {}> = {
  view: (vnode) => {
    const { users, avatarSize, tooltip } = vnode.attrs;
    const userCount = users.length;
    const displayedUsers = (users as any)
      .slice(0, Math.max(userCount, 10))
      .map((user) => {
        const { address, chain } = user;
        return m(User, {
          user: new AddressInfo(null, address, chain, null),
          avatarOnly: true,
          tooltip,
          avatarSize,
        });
      });
    const remainingUsers = userCount < 10 ? 0 : userCount - 10;
    return m('.UserGallery', { class: vnode.attrs.class }, [
      displayedUsers,
      remainingUsers
      && m(`and ${remainingUsers} others`)
    ]);
  }
};

export default UserGallery;
