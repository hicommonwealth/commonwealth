import 'pages/home.scss';

import { default as m } from 'mithril';
import { JoinCommunitiesContent } from 'views/modals/join_communities_modal';

const HomePage : m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.HomePage', [
      m('.home-content', [
        m('.container', [
          m('h2.lead-title', 'On-chain communities'),
          m('p.lead-description', [
            'Forums, profiles, and voting for decentralized organizations',
          ]),
          m(JoinCommunitiesContent, { showLockdropContent: true })
        ]),
      ]),
    ])
  }
};

export default HomePage;
