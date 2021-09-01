import 'pages/commonwealth/projects/list.scss';

import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/commonwealth/project_card';
import { CMNProject } from 'models';

export const connectionReady = () => {
  if (!app.chain || !app.cmnProtocol || !app.cmnProtocol.initialized) return false;
  if (app.activeChainId() !== app.cmnProtocol.chainId) return false;
  return true;
};

const ProjectsPage: m.Component<{}, {initialized: boolean, projects: CMNProject[]}> = {
  onupdate: async (vnode) => {
    if (!connectionReady()) return;

    vnode.state.projects = await app.cmnProtocol.project_protocol.syncProjects();
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      m.redraw();
    }
  },

  view: (vnode) => {
    if (!connectionReady() || !vnode.state.initialized) return m(PageLoading);
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
