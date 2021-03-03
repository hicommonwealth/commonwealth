import 'pages/home/index.scss';

import m from 'mithril';

import Sublayout from 'views/sublayout';
import CommunityCards from './community_cards';

const Homepage: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m(Sublayout, {
      class: 'Homepage',
      hero: m('.hero-unit', [
        m('.layout-container', [
          m('.hero-unit-left', [
            m('.hero-image', [
              m('.hero-image-inner', [
                m('img', { src: '/static/img/hero_icon.png' }),
              ]),
            ]),
          ]),
          m('.hero-unit-right', [
            m('h2', 'Discussions and governance for decentralized communities'),
            m('p', [
              'Commonwealth lets you conduct ongoing discussions, manage on-chain proposals, ',
              'and poll community members from one simple interface.',
            ]),
          ]),
        ]),
      ]),
    }, [
      m(CommunityCards),
    ]);
  }
};

export default Homepage;
