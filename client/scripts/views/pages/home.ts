import 'pages/home.scss';

import { default as m } from 'mithril';
import HomepageCommunities from 'views/components/homepage_communities';

const HomePage : m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.HomePage', [
      m('.home-content', [
        m('.container', [
          m('h2.lead-title', 'On-chain communities'),
          m('p.lead-description', [
            'Forums, profiles, and voting for decentralized organizations',
          ]),
          m(HomepageCommunities),
        ]),
      ]),
    ])
  }
};

export default HomePage;
