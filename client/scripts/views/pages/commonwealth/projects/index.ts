import 'pages/commonwealth/projects/list.scss';

import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/commonwealth/project_card';
import { protocolReady } from 'controllers/chain/ethereum/commonwealth/utils';
import { CMNProject } from 'models';

const ProjectsPage: m.Component<{}, {initialized: number, projects: CMNProject[]}> = {
  oncreate: (vnode) => {
    vnode.state.initialized = 0;
  },
  onupdate: async (vnode) => {
    if (!protocolReady()) return;

    if (vnode.state.initialized !== 2) {
      if (vnode.state.initialized === 0) {
        vnode.state.initialized = 1;
        vnode.state.projects = await app.cmnProtocol.project_protocol.getProjects();
        vnode.state.initialized = 2;
        m.redraw();
      }
    }
  },

  view: (vnode) => {
    if (vnode.state.initialized !== 2) return m(PageLoading);
    const notLoggedIn = !app.user.activeAccount || !app.isLoggedIn();

    const { projects } = vnode.state;
    const activeProjectsContent = (projects
      .filter((p) => p.status === 'In Progress') || [])
      .map((p) => m(ProjectCard, { project: p }));

    const failedProjects = (projects
      .filter((p) => p.status === 'Failed') || [])
      .map((p) => m(ProjectCard, { project: p }));

    const successedProjects = (projects
      .filter((p) => p.status === 'Successed') || [])
      .map((p) => m(ProjectCard, { project: p }));

    return m(Sublayout, {
      class: 'ProjectsPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m('.stats-box', [
        m('div', 'CMN Protocol Page'),
        m('br'),
        notLoggedIn && m('div', 'Please login first'),
        m('div', 'You can find "New Project" button in the the New Thread dropdown'),
      ]),
      m(Listing, {
        content: activeProjectsContent,
        columnHeader: `${activeProjectsContent.length === 0 ? 'No' : ''} Active Projects`,
      }),
      m('.clear'),
      m(Listing, {
        content: successedProjects,
        columnHeader: `${successedProjects.length === 0 ? 'No' : ''} Successed Projects`,
      }),
      m('.clear'),
      m(Listing, {
        content: failedProjects,
        columnHeader: `${failedProjects.length === 0 ? 'No' : ''} Failed Projects`,
      }),
    ]);
  }
};

export default ProjectsPage;
