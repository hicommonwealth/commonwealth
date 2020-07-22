import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';
import Login from 'views/components/login';
import Sublayout from 'views/sublayout';

const LoginPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'LoginPage' });
  },
  view: (vnode) => {
    // this page requires a logged-out user
    if (app.isLoggedIn()) {
      if (app.activeChainId()) m.route.set(`/${app.activeChainId()}/settings`);
      else m.route.set('/settings');
      return;
    }
    return m(Sublayout, {
      class: 'LoginPage',
    }, [
      m(Login),
    ]);
  }
};

export default LoginPage;
