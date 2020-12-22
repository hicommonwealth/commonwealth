import 'pages/home/index.scss';

import m from 'mithril';

import Sublayout from 'views/sublayout';
import CommunityCards from './community_cards';

const Homepage: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m(Sublayout, {
      class: 'Homepage',
    }, [
      m('.container', [
        m('h1', 'Commonwealth'),
        m('p.lead-copy', 'On-chain communities'),
        m(CommunityCards),
      ]),
    ]);
  }
};

export default Homepage;
