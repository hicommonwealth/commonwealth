import 'pages/home/index.scss';

import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import CommunityCards from './community_cards';
import Search from './search';

const Homepage: m.Component<{}, {}> = {
  oncreate: (vnode) => {
    if (app.lastNavigatedBack() && localStorage['home-scrollY']) {
      setTimeout(() => {
        window.scrollTo(0, Number(localStorage['home-scrollY']));
      }, 1);
    }
  },
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
      m(Search),
      m(CommunityCards),
    ]);
  }
};

export default Homepage;
