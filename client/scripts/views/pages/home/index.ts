import 'pages/home/index.scss';

import m from 'mithril';
import CommunityCards from './community_cards';
import Examples from './examples';

const Homepage: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m('.Homepage', [
      m('.container', [
        m(CommunityCards),
      ]),
      m(Examples),
    ]);
  }
};

export default Homepage;
