import 'pages/commonwealth/projects.scss';

import m from 'mithril';
import app from 'state';
import { initChain } from 'app';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/project_card';

const Description: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;
    return m('.stats-box', [
      m('div', [
        'Projects can be introduced by anyone.',
      ]),
      m('br'),
      m('div', '- MVP version that use offchain local data, a production version will interact with real chain and contract data'),
      m('div', '- Protocol will be set by admin'),
    ]);
  }
};

const ProjectsPage: m.Component<{}, { initializing: boolean }> = {
  oncreate: async (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      vnode.state.initializing = true;
      await initChain();
      // app.chain.deferred = false;
      vnode.state.initializing = false;
      m.redraw();
    }
  },
  view: (vnode) => {
    if (vnode.state.initializing || !app.chain || !app.chain.loaded || !(app.chain as any).protocol) {
      return m(PageLoading);
    }

    const projects = (app.chain as any).protocol ? (app.chain as any).protocol.get('root').projects : [];
    const activeProjectsContent = projects ? projects.filter((p) => p.status === 'In Progress').map((p) => m(ProjectCard, { project: p })) : [];
    const failedProjects = projects ? projects.filter((p) => p.status === 'Failed').map((p) => m(ProjectCard, { project: p })) : [];
    const successedProjects = projects ? projects.filter((p) => p.status === 'Successed').map((p) => m(ProjectCard, { project: p })) : [];

    return m(Sublayout, {
      class: 'ProjectsPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m(Description),
      m(Listing, {
        content: activeProjectsContent,
        columnHeader: `${activeProjectsContent.length === 0 ? 'No' : ''} Active Proposals`,
      }),
      m('.clear'),
      m(Listing, {
        content: successedProjects,
        columnHeader: `${successedProjects.length === 0 ? 'No' : ''} Successed Proposals`,
      }),
      m('.clear'),
      m(Listing, {
        content: failedProjects,
        columnHeader: `${failedProjects.length === 0 ? 'No' : ''} Failed Proposals`,
      }),
    ]);
  }
};

export default ProjectsPage;
