/* eslint-disable no-script-url */
import 'components/widgets/user_gallery.scss';

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
    const uniqueUsers = _.uniq((users as any[]).map((u) => `${u.address}#${u.chain}`))
      .map((u) => u.split('#'));
    const userCount = uniqueUsers.length - 1;
    const displayedUsers = (uniqueUsers as any)
      .slice(0, Math.min(userCount, 10))
      .map(([address, chain]) => {
        return m(User, {
          user: new AddressInfo(null, address, chain, null),
          avatarOnly: true,
          tooltip,
          avatarSize,
        });
      });
    const overflowUsers = userCount < 10 ? 0 : userCount - 10;
    if (overflowUsers) displayedUsers.push(
      m('.overflow-users-wrap', {
        style: `width: ${avatarSize}px; height: ${avatarSize}px;`
      }, [
        m('.overflow-users', `+${overflowUsers}`)
      ])
    );
    return m('.UserGallery', { class: vnode.attrs.class }, [
      displayedUsers,
    ]);
  }
};

export default UserGallery;
