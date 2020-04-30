import 'pages/landing/about.scss';

import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import LandingPage from 'views/pages/landing/landing';
import { renderMultilineText } from 'helpers';

const AboutPage = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'AboutPage' });
  },
  view: (vnode) => {
    return m(LandingPage, {
      header: m('.AboutPage', [
      ]),
      body: m('.AboutPage', [
      ]),
    });
  }
};

export default AboutPage;
