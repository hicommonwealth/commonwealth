import 'pages/home/index.scss';

import m from 'mithril';
import MarketingModules from './marketing_modules';
import CommunityCards from './community_cards';
import Header from './header';

const Homepage: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m('.Homepage', [
      m('.container', [
        m(Header),
        m(CommunityCards),
        // m(MarketingModules),
      ]),
    ]);
  }
};

export default Homepage;
