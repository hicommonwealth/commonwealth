import 'pages/commonwealth/projects/list.scss';

import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/commonwealth/project_card';
import { CMNProject } from 'models';

const connectionReady = () => {
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

    const { projects } = vnode.state;
    const activeProjectsContent = projects
      .filter((p) => p.status === 'In Progress')
      .map((p) => m(ProjectCard, { project: p }));

    const failedProjects = projects
      .filter((p) => p.status === 'Failed')
      .map((p) => m(ProjectCard, { project: p }));

    const successedProjects = projects
      .filter((p) => p.status === 'Successed')
      .map((p) => m(ProjectCard, { project: p }));

    return m(Sublayout, {
      class: 'ProjectsPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m('.stats-box', [
        m('div', [
          'This is a UI version, not a production version',
        ]),
        m('div', '- Please login and connect your wallet'),
        m('div', '- Protocol information (like protocolFee and feeTo) will be set by admin or Protocol manager'),
        m('div', '- Curators can redeem CTokens when project funding is successed'),
        m('div', '- Backers can redeem BTokens when project funding is failed'),
        m('div', '- Beneficiary can only withdraw when project funding is successed'),
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
