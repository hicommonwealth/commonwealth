/* eslint-disable @typescript-eslint/ban-types */

import '../../static/fonts/fonts.css';
import '../styles/normalize.css'; // reset
import '../styles/tailwind_reset.css'; // for the landing page
import '../styles/shared.scss';
import 'construct.scss';
import 'lity/dist/lity.min.css';
import m from 'mithril';
import $ from 'jquery';

import './fragment-fix';
import app, { initAppState, LoginState } from 'state';

import { getRoutes, handleLoginRedirects } from 'router';
import momentUpdateLocale from 'helpers/momentUpdateLocale';
import injectGoogleTagManagerScript from 'helpers/injectGoogleTagManagerScript';
import handleWindowError from 'helpers/handleWindowError';
import initializeMixpanel from 'helpers/initializeMixpanel';
import showLoginNotification from 'helpers/showLoginNotification';
import handleUpdateEmailConfirmation from 'helpers/handleUpdateEmailConfirmation';

// set up ontouchmove blocker
document.ontouchmove = (event) => {
  event.preventDefault();
};

Promise.all([$.ready, $.get('/api/domain')]).then(
  async ([, { customDomain }]) => {
    handleWindowError();

    m.route(document.body, '/', getRoutes(customDomain));

    injectGoogleTagManagerScript();
    initializeMixpanel();
    handleLoginRedirects();
    showLoginNotification();
    momentUpdateLocale();

    // initialize the app
    initAppState(true, customDomain)
      .then(async () => {
        if (app.loginState === LoginState.LoggedIn) {
          // refresh notifications once
          // grab all discussion drafts
          app.user.discussionDrafts.refreshAll().then(() => m.redraw());
        }

        // If the user updates their email
        handleUpdateEmailConfirmation();

        m.redraw();
      })
      .catch(() => {
        m.redraw();
      });
  }
);

// /////////////////////////////////////////////////////////
// For browserify-hmr
// See browserify-hmr module.hot API docs for hooks docs.
declare const module: any; // tslint:disable-line no-reserved-keywords
if (module.hot) {
  module.hot.accept();
}
// /////////////////////////////////////////////////////////
