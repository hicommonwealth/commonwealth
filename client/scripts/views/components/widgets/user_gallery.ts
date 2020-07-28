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
    return m('.UserGallery', { class: vnode.attrs.class },
      (users as any).map((user) => {
        const { address, chain } = user;
        return m(User, {
          user: new AddressInfo(null, address, chain, null),
          avatarOnly: true,
          tooltip,
          avatarSize,
        });
      })
    );
  }
};

export default UserGallery;
