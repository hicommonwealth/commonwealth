/* @jsx m */

import m from 'mithril';

import app from 'state';
import { PageLoading } from './loading';

class DiscussionsRedirect implements m.ClassComponent {
  view() {
    if (app.chain) {
      if (app.chain.meta.defaultOverview) {
        m.route.set(`${app.activeChainId()}/overview`);
      } else {
        m.route.set(`${app.activeChainId()}/discussions`);
      }
    } else {
      return <PageLoading />;
    }
  }
}

export default DiscussionsRedirect;
