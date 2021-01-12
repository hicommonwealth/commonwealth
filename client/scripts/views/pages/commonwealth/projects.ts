import m from 'mithril';
import app from 'state';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

const ProjectsPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: 'Projects',
        showNewProposalButton: true,
      });
    }

    return m(Sublayout, {
      class: 'ProjectsPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      'projects go here'
    ]);
  }
};

export default ProjectsPage;
