import 'pages/commonwealth/projects/list.scss';

import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/commonwealth/project_card';
import { CWProject } from 'models/CWProtocol';

const connectionReady = () => {
  if (!app.chain) return false;
  const protocol = (app.chain as any).protocol;
  if (!protocol || !protocol.initialized || !protocol.projectStore) return false;
  return true;
}

const ProjectsPage: m.Component<{}, {initialized: boolean, projects: CWProject[]}> = {
  onupdate: async(vnode) => {
    if (!connectionReady()) return;
    vnode.state.projects = await (app.chain as any).protocol.syncProjects();
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      m.redraw();
    }
  },

  view: (vnode) => {
    if (!connectionReady() || !vnode.state.initialized) return m(PageLoading);

    const { projects } = vnode.state;
    const activeProjectsContent = projects.filter((p) => p.status === 'In Progress').map((p) => m(ProjectCard, { project: p }));
    const failedProjects = projects.filter((p) => p.status === 'Failed').map((p) => m(ProjectCard, { project: p }));
    const successedProjects = projects.filter((p) => p.status === 'Successed').map((p) => m(ProjectCard, { project: p }));

    return m(Sublayout, {
      class: 'ProjectsPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m('.stats-box', [
        m('div', [
          'This is a UI version that use offchain local data, a production version will interact with real chain and contract data.',
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