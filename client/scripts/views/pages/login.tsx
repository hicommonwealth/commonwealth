/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { navigateToSubpage } from 'app';

import Login from 'views/components/login';
import Sublayout from 'views/sublayout';

class LoginPage implements m.ClassComponent {
  oncreate() {
    mixpanel.track('PageVisit', { 'Page Name': 'LoginPage' });
  }

  view() {
    // this page requires a logged-out user
    if (app.isLoggedIn()) {
      if (app.activeChainId()) navigateToSubpage('/settings');
      else m.route.set('/settings');
      return;
    }

    return <Sublayout>{m(Login)}</Sublayout>;
  }
}

export default LoginPage;
