import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';
import { AddressInfo } from 'models';
import {
  CWBacker,
  CWCurator,
} from 'controllers/chain/ethereum/projects/participants';
import { CWButton } from '../../../components/component_kit/cw_button';
import ProjectCard, { ProjectCardSize } from './project_card';
import Sublayout from '../../../sublayout';
import { DummyProject } from './dummy_project';
import { CWTextInput } from '../../../components/component_kit/cw_text_input';

type ProjectProgress = {
  inBlocks: number;
  asPercent: number;
};

type ProjectDeadline = {
  inBlocks: number;
  asDate: moment.Moment;
};

type ProjectFunds = {
  inTokens: number;
  inDollars: number;
};

interface ICreateProjectForm {
  name: string;
  token: string;
  threshold: number;
  fundraiseLength: number;
  beneficiary: string;
  shortDescription: string;
  description: string;
}

export type Project = {
  id: number;
  chain: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage: string;
  token: any;
  creator: AddressInfo;
  beneficiary: AddressInfo;
  backers: CWBacker[];
  curatorCut: number;
  curators: CWCurator[];
  createdAt: moment.Moment;
  progress: ProjectProgress;
  deadline: ProjectDeadline;
  threshold: ProjectFunds;
  raised: ProjectFunds;
};

// interface ProjectListingState {
// }

const ProjectListing: m.Component<{}, { form: ICreateProjectForm }> = {
  view: (vnode) => {
    const projects = app.activeChainId()
      ? app.projects.filter((project) => project.chain === app.activeChainId())
      : app.projects;
    const userCreatedProjects: Project[] = Array(2).fill(DummyProject); // projects.filter(...)
    const userBackedProjects: Project[] = Array(4).fill(DummyProject); // projects.filter(...)
    const userPreviouslyBackedProjects: Project[] = Array(6).fill(DummyProject); // projects.filter(...)
    const trendingProjects: Project[] = Array(2).fill(DummyProject); // projects.filter(...)
    const recommendedProjects: Project[] = Array(4).fill(DummyProject); // projects.filter(...)
    return m(
      Sublayout,
      {
        class: 'ProjectListing',
        title: 'Projects',
        showNewProposalButton: false,
      },
      [
        (userCreatedProjects.length ||
          userBackedProjects.length ||
          userPreviouslyBackedProjects.length) &&
          m('.user-projects', [
            userCreatedProjects.length &&
              m('.user-created-project-wrap', [
                m('.user-created-project-header', [
                  m('h1', 'Your Projects'),
                  m(CWButton, {
                    intent: 'primary',
                    label: 'Create New Project',
                    onclick: () => true, // m.route.set(`${app.activeId()}/createProject`)
                  }),
                ]),
                m(
                  '.user-created-projects',
                  userCreatedProjects.map((project) => {
                    return m(ProjectCard, {
                      project,
                      size: ProjectCardSize.Large,
                    });
                  })
                ),
              ]),
            m('.user-backed-project-wrap', [
              m('h2', 'Currently Backing'),
              m(
                '.user-backed-projects',
                userBackedProjects.map((project) => {
                  return m(ProjectCard, {
                    project,
                    size: ProjectCardSize.Medium,
                  });
                })
              ),
            ]),
            m('.user-previously-backed-project-wrap', [
              m('h3', 'Past Contributions'),
              m(
                '.user-previously-backed-projects',
                userPreviouslyBackedProjects.map((project) => {
                  return m(ProjectCard, {
                    project,
                    size: ProjectCardSize.Small,
                  });
                })
              ),
            ]),
          ]),
        (trendingProjects.length || recommendedProjects.length) &&
          m('.community-projects', [
            m('h1', 'Discover'),
            m('.project-discovery', [
              m('.trending-projects', [
                m('h2', 'Trending'),
                trendingProjects.map((project) => {
                  return m(ProjectCard, {
                    project,
                    size: ProjectCardSize.Large,
                  });
                }),
              ]),
              m('.recommended-projects', [
                m('h2', 'Recommended'),
                recommendedProjects.map((project) => {
                  return m(ProjectCard, {
                    project,
                    size: ProjectCardSize.Medium,
                  });
                }),
              ]),
            ]),
          ]),
        m('.CreateProjectForm', [
          m(CWTextInput, {
            label: 'Name',
            name: 'Name',
            oninput: (e) => {
              vnode.state.form.name = e.target.value;
            },
          }),
          m(CWTextInput, {
            label: 'Raise In',
            name: 'Raise In',
            oninput: (e) => {
              vnode.state.form.token = e.target.value;
            },
          }),
          m(CWTextInput, {
            label: 'Minimum Raise',
            name: 'Minimum Raise',
            oninput: (e) => {
              vnode.state.form.threshold = Number(e.target.value);
            },
          }),
          m(CWTextInput, {
            label: 'Fundraise Length',
            name: 'Fundraise Length',
            oninput: (e) => {
              vnode.state.form.fundraiseLength = e.target.value;
            },
          }),
          m(CWTextInput, {
            label: 'Beneficiary Address',
            name: 'Beneficiary Address',
            oninput: (e) => {
              vnode.state.form.beneficiary = e.target.value;
            },
          }),
          m(CWTextInput, {
            label: 'Summary',
            name: 'Summary',
            oninput: (e) => {
              vnode.state.form.shortDescription = e.target.value;
            },
          }),
          m(CWTextInput, {
            label: 'Description',
            name: 'Description',
            oninput: (e) => {
              vnode.state.form.description = e.target.value;
            },
          }),
        ]),
      ]
    );
  },
};

export default ProjectListing;
