import 'pages/discussions/sidebar.scss';

import _ from 'lodash';
import m from 'mithril';
import app from 'state';
import User from 'views/components/widgets/user';
import { AddressInfo } from 'client/scripts/models';


export const MostActiveUser: m.Component<{ user: AddressInfo, activityCount: number }, {}> = {
  view: (vnode) => {
    const { user, activityCount } = vnode.attrs;
    return m('.MostActiveUser', [
      m(User, {
        user,
        avatarSize: 24
      }),
      m('.activity-count', activityCount)
    ]);
  }
};