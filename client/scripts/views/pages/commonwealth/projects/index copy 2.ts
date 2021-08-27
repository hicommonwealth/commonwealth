import 'pages/commonwealth/projects/list.scss';

import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/commonwealth/project_card';
import TokenInputField from 'views/components/commonwealth/token_input';
import { CMNProject } from 'models';

const connectionReady = () => {
  if (!app.chain) return false;
  const project_protocol = (app.chain as any).project_protocol;
  if (!project_protocol || !project_protocol.initialized || !project_protocol.projectStore) return false;
  return true;
};

const ProjectsPage: m.Component<{}, {initialized: boolean, projects: CMNProject[]}> = {
  onupdate: async (vnode) => {
  },

  view: (vnode) => {
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
      m(TokenInputField, {
        tokens: [
          {
            id: 'ETH',
            name: 'ETH',
            address: {
              kovan: '',
              mainnet: ''
            },
            decimals: 18,
            symbol: 'ETH',
            icon_url: ''
          },
          {
            id: 'USDT',
            name: 'USDT',
            address: {
              kovan: '',
              mainnet: ''
            },
            decimals: 6,
            symbol: 'USDT',
            icon_url: ''
          },
        ]
      }),
    ]);
  }

};

export default ProjectsPage;
