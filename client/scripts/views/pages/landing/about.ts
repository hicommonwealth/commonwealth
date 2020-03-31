import 'pages/landing/about.scss';

import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import LandingPage from 'views/pages/landing/landing';
import { renderMultilineText } from 'helpers';

const AboutPage = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {'Page Name': 'AboutPage'});
  },
  view: (vnode) => {
    return m(LandingPage, {
      header: m('.AboutPage', [
        m('.about-container', [
          m('h2.page-title', 'About'),
          m('.page-header', [
            m('p', 'We help cryptocurrency networks organize themselves with forums, voting systems, ' +
              'and other governance tools.'),
          ]),
        ]),
      ]),
      body: m('.AboutPage', [
        m('.about-container', [
        ]),
      ]),
    });
  }
};

export default AboutPage;
