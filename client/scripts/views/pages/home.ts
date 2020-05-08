import 'pages/home.scss';

import { default as m } from 'mithril';
import app from 'state';
import HomepageCommunities from 'views/components/homepage_communities';
import PseudoHeader from 'views/components/pseudoheader';

const HomePage : m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.HomePage', [
      m('.home-content', [
        m('.container', [
          m(PseudoHeader),
          m(HomepageCommunities),
        ]),
      ]),
    ]);
  }
};

export default HomePage;
