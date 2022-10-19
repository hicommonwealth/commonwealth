/* @jsx m */

import app from 'state';
import m from 'mithril';

import 'pages/loading.scss';

import Sublayout from 'views/sublayout';
import { CWSpinner } from '../components/component_kit/cw_spinner';

 class DiscussionsRedirect implements m.ClassComponent {
  view(vnode) {
    if (app.chain) {
      if (app.chain.meta.defaultOverview) m.route.set(`${app.activeChainId()}/overview`);
      else m.route.set(`${app.activeChainId()}/discussions`);
    } else return (
      <Sublayout hideSearch={true}>
        <div class="LoadingPage">
          <CWSpinner size="xl" />
        </div>
      </Sublayout>
    );
  }
}

export default DiscussionsRedirect;