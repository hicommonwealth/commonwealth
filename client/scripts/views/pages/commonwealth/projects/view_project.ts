import 'pages/projects/view_project.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import { ProjectCompletionBar } from './project_card';
import { Project } from './index';
import Sublayout from '../../../sublayout';
import { AnonymousUser } from '../../../components/widgets/user';
import { CWButton } from '../../../components/component_kit/cw_button';
import { PageNotFound } from '../../404';
import { DummyProject } from './dummy_project';
import MarkdownFormattedText from '../../../components/markdown_formatted_text';
import { CWTable } from '../../../components/component_kit/cw_table';

interface ProjectPageAttrs {
  identifier: string;
}

interface ProjectPageState {}

const ProjectPage: m.Component<ProjectPageAttrs, ProjectPageState> = {
  view: (vnode) => {
    const { identifier } = vnode.attrs;
    if (typeof identifier !== 'string') {
      return m(PageNotFound, { title: 'Projects' });
    }
    const projectId = identifier.split('-')[0];
    const project: Project = DummyProject; // TODO: Fetch via controller

    return m(
      Sublayout,
      {
        class: 'ProjectPage',
        title: 'Project',
        showNewProposalButton: false,
      },
      m('.project-wrap', [
        m('h1', project.title),
        m('.project-metadata', [
          m('.metadata-left', [
            m('h2', project.token),
            // TODO: replace with // m(User, { user: project.creator }),
            m(AnonymousUser, { distinguishingKey: '1' }),
          ]),
          m('.metadata-right', [
            m(Tag, { label: `${project.createdAt.format('MMMM D, YYYY')}` }),
            m(Tag, { label: `${project.deadline.inBlocks} Blocks` }),
          ]),
        ]),
        m(
          'h3.project-short-description',
          project.shortDescription || project.description.slice(0, 100)
        ),
        m('img.project-header-img', { src: project.coverImage }),
        m(ProjectCompletionBar, {
          completionPercent: project.progress.asPercent,
        }),
        m('.project-funding-data', [
          m('.left-panel', [
            m('.project-funds-raised', [
              m('h3', 'Funds raised'),
              m('h1', `${project.raised.inTokens} ETH`), // TODO: ETH shouldn't be hardcoded
            ]),
            m('.project-funds-goal', [
              m('h3', 'Goal'),
              m('h1', `${project.threshold.inTokens} ETH`), // TODO: ETH shouldn't be hardcoded
            ]),
          ]),
          m('.right-panel', [
            m(CWButton, {
              intent: 'primary',
              label: 'Contribute to this project',
              onclick: () => true,
            }),
          ]),
        ]),
        m('.project-curator-data', [
          m(CWButton, {
            buttonType: 'secondary',
            disabled: true,
            label: project.beneficiary.address.slice(0, 7),
          }),
          m('h3', `Curator receives ${project.curatorCut * 100}% of funds.`),
        ]),
        m('.project-about', [
          m('h1', 'About'),
          m(MarkdownFormattedText, {
            doc: project.description,
          }),
        ]),
        m('hr'),
        m('.project-backers', [
          m(CWTable, {
            className: 'project-backer-table',
            tableName: 'Backers',
            headers: ['Backer', 'Amount'],
            entries: project.backers.map((backer) => {
              return [
                m('span', `${backer.backerAddress}`), // TODO: ETH not hardcoded
                m('span', `${backer.backerAmount} ETH`),
              ];
            }),
          }),
        ]),
      ])
    );
  },
};

export default ProjectPage;
