import 'pages/commonwealth/projects.scss';

import m from 'mithril';
import moment from 'moment';
import { Card, Button } from 'construct-ui';

import { initChain } from 'app';
import app from 'state';
import { AddressInfo } from 'models';
import { pluralize } from 'helpers';

import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import ProjectCard from 'views/components/project_card';
import { AnyProject } from 'views/components/project_card';

const ActiveProjects: AnyProject[] = [
  {
    projectId: '100',
    name: 'active project1',
    description: 'this is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test project',
    slug: 'slug1',
    identifier: 'identifier1',
    threadId: '1-123',
    totalFunding: 1000,
    threadhold: 1100,
    token: 'USDC',
    curators: [],
    backers: [],
  },
  {
    projectId: '101',
    name: 'active project2',
    description: 'this is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test projectthis is a test project, this is a test project, this is a test project, this is a test project, this is a test project, this is a test project',
    threadId: '1-123',
    slug: 'slug2',
    identifier: 'identifier2',
    totalFunding: 100,
    threadhold: 100,
    token: 'USDC',
    curators: [],
    backers: [],
  }
]

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;
    return m('.stats-box', [
      m('span', [
        'Projects can be introduced by anyone. At a regular interval, the top ranked proposal will become a supermajority-required referendum.',
      ]),
    ]);
  }
};

const ProjectsPage: m.Component<{}, { initializing: boolean }> = {
  oncreate: async (vnode) => {
  },
  view: (vnode) => {
    const activeProposalContent = ActiveProjects.map((project) => m(ProjectCard, { project }));
    // const inActiveProposalContent = INACTIVEPROJECTS.map((project) => m(ProjectCard, { project }));

    return m(Sublayout, {
      class: 'ProjectsPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m(SubstrateProposalStats),
      m(Listing, {
        content: activeProposalContent,
        columnHeader: 'Active Proposals',
      }),
      // m(Listing, {
      //   content: inActiveProposalContent,
      //   columnHeader: 'InActive Proposals',
      // }),
    ]);
  }
};

export default ProjectsPage;
