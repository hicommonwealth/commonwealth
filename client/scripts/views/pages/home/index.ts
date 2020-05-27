import 'pages/home/index.scss';

import { default as m } from 'mithril';
import MarketingModules from './marketing_modules';
import Communities from './community_cards';
import Header from './header';

const Homepage: m.Component<{}, {}> = {
  view: (vnode: m.VnodeDOM) => {
    return m('.Homepage', [
      m('.container', [
        m(Header),
        m(Communities),
        // m(MarketingModules),
      ]),
    ]);
  }
};

export default Homepage;
