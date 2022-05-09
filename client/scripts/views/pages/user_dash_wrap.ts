import m from 'mithril';
import { UserDashboard } from './user_dashboard';
const UserDashWrap = {
  view: (vnode) => {
    return m(UserDashboard);
  },
};

export default UserDashWrap;
