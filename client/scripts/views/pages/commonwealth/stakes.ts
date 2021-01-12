import m from 'mithril';
import app from 'state';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

const StakesPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: 'Stakes',
        showNewProposalButton: true,
      });
    }

    return m(Sublayout, {
      class: 'StakesPage',
      title: 'Stakes',
      showNewProposalButton: true,
    }, [
      'stakes go here'
    ]);
  }
};

export default StakesPage;
