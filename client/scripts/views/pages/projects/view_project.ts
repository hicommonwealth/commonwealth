import 'pages/crowdfund/view_project.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import QuillFormattedText from '../../components/quill_formatted_text';
import { ProjectCompletionBar } from './project_card';
import { Project } from './index';
import Sublayout from '../../sublayout';
import User from '../../components/widgets/user';
import { CWButton } from '../../components/component_kit/cw_button';
import PageNotFound from '../404';
import { DummyProject } from './dummy_project';

interface ProjectPageAttrs {
  identifier: string;
}

interface ProjectPageState {
}

const ProjectPage: m.Component<ProjectPageAttrs, ProjectPageState> = {
  view: (vnode) => {
    const { identifier } = vnode.attrs;
    if (typeof identifier !== 'string') {
      return m(PageNotFound, { title: 'Projects' });
    }
    const projectId = identifier.split('-')[0];
    const project = DummyProject; // TODO: Fetch via controller

    return m(Sublayout, {
      class: 'ProjectPage',
      title: 'Project',
      showNewProposalButton: false,
    }, [
      m('h1', project.title),
      m('.project-metadata', [
        m(User, { user: project.creator }),
        m(Tag, { label: `${project.createdAt}` }),
        m(Tag, { label: `${project.deadline.inBlocks}` }),
      ]),
      m('.project-short-description', project.shortDescription || project.description.slice(0, 100)),
      m('img.project-header-img'),
      m(ProjectCompletionBar, { completionPercent: project.progress.asPercent }),
      m('.project-funding-data', [
        m('.left-panel', [
          m('.project-funds-raised', [
            m('h3', 'Funds raised'),
            m('p', project.raised.inTokens),
            m('p', project.raised.inDollars)
          ]),
          m('.project-funds-goal', [
            m('h3', 'Goal'),
            m('p', project.threshold.inTokens),
            m('p', project.threshold.inDollars)
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
        m(QuillFormattedText, {
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
    ]);
  }
}

export default ProjectPage;