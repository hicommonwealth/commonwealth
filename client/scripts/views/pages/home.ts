import 'pages/home.scss';

import { default as m } from 'mithril';
import HomepageCommunities from 'views/components/homepage_communities';

const HomePage : m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m('.HomePage', [
      m('.home-content', [
        m('.container', [
          m(HomepageCommunities),
        ]),
      ]),
    ]);
  }
};

export default HomePage;
