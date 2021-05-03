import 'pages/commonwealth/projects.scss';

import m from 'mithril';

import Sublayout from 'views/sublayout';

import ProjectContentModule from './content';
import ActionModule from './action';
import MembersModule from './members';

const ViewProjectPage: m.Component<{}, {}> = {
  view: (vnode) => {
    const project = {
      projectId: '100',
      name: 'active project1',
      description: 'this is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test project',
      slug: 'slug1',
      identifier: 'identifier1',
      threadId: '1-123',
      totalFunding: 1000,
      threadhold: 1100,
      token: 'USDC',

      curators: [
        {
          name: 'curator1',
          address: '0x4E7804bf331183adad98Af5AfBdA5F27A3E84e81',
          amount: 10,
        },
        {
          name: 'curator2',
          address: '0xAE7804bf331183adad98Af5AfBdA5F27A3E84e81',
          amount: 10,
        },
        {
          name: 'curator3',
          address: '0x1E7804bf331183adad98Af5AfBdA5F27A3E84e81',
          amount: 10,
        }
      ],
      backers: [
        {
          name: 'backer1',
          address: '0xAE7804bf331183adad98Af5AfBdA5F27A3E84e81',
          amount: 10,
        },
        {
          name: 'backer2',
          address: '0xCE7804bf331183adad98Af5AfBdA5F27A3E84e81',
          amount: 10,
        },
        {
          name: 'backer3',
          address: '0xBE7804bf331183adad98Af5AfBdA5F27A3E84e81',
          amount: 10,
        }
      ]
    }

    return m(Sublayout, {
      class: 'ProjectPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m('.container', [
        m('.row', [
          m(ProjectContentModule, { project }),
          m(ActionModule, { project })
        ]),
        m(MembersModule, { project })
      ]),
    ]);
  }
}

export default ViewProjectPage;