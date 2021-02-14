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
            m('h2', 'Discussions & governance for decentralized organizations'),
            m('p', [
              'Create longform threads, vote on proposals, and poll your community.',
            ]),
            m('p', [
              'Commonwealth keeps your governance activity organized and searchable.',
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
