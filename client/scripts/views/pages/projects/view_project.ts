import 'pages/crowdfund/view_project.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import QuillFormattedText from '../../components/quill_formatted_text';
import { ProjectCompletionBar } from './project_card';
import { Project } from './index';
import Sublayout from '../../sublayout';
import User, { AnonymousUser } from '../../components/widgets/user';
import { CWButton } from '../../components/component_kit/cw_button';
import PageNotFound from '../404';
import { DummyProject } from './dummy_project';
import MarkdownFormattedText from '../../components/markdown_formatted_text';

interface ProjectPageAttrs {
  identifier: string;
}

interface ProjectPageState {
}

const ProjectCompletionBar: m.Component<{ completionPercent: number }> = {
  view: (vnode) => {
    const { completionPercent } = vnode.attrs;
    console.log(completionPercent);
    return m('.ProjectCompletionBar', [
      m('.completed-percentage', {
        style: `width: ${completionPercent * 100}%`
      }),
    ]);
  }
}

const ProjectPage: m.Component<ProjectPageAttrs, ProjectPageState> = {
  view: (vnode) => {
    const { identifier } = vnode.attrs;
    if (typeof identifier !== 'string') {
      return m(PageNotFound, { title: 'Projects' });
    }
    const projectId = identifier.split('-')[0];
    const project: Project = DummyProject; // TODO: Fetch via controller

    return m(Sublayout, {
      class: 'ProjectPage',
      title: 'Project',
      showNewProposalButton: false,
    }, m('.project-wrap', [
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
          ])
        ]),
        m('h3.project-short-description', project.shortDescription || project.description.slice(0, 100)),
        m('img.project-header-img', { src: project.coverImage }),
        m(ProjectCompletionBar, { completionPercent: project.progress.asPercent }),
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
            })
          ])
        ]),
        m('.project-about', [
          m('h2', 'About'),
          m(MarkdownFormattedText, {
            doc: project.description
          }),
        ]),
        m('hr'),
        m('.project-backers', [
          m('h2', 'Backers')
          // m(CWTable, {
          //  className: 'project-backer-table'
          //  entries: project.backers.map((backer) => {
          //    m('.backer-row', [
          //      m(User),
          //      m('.contribution', backer.contribution)
          //     ])
          //  })
          // })
        ])
      ])
    );
  }
}

export default ProjectPage;