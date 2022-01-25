import 'pages/crowdfund/project_page.scss';

import m from 'mithril';
// import SearchBar from '../../components/search_bar';
// import { ButtonIntent, FaceliftButton } from '../../components/component_kit/buttons';
import QuillFormattedText from '../../components/quill_formatted_text';
// import User from '../../components/widgets/user';
import { DummyProjectData, ProjectCompletionBar } from './project_card';
import { Project } from './index';
import Sublayout from '../../sublayout';
import User from '../../components/widgets/user';
import { ButtonIntent, FaceliftButton } from '../../components/component_kit/buttons';

interface ProjectPageAttrs {
  project: Project;
}

interface ProjectPageState {
}

const ProjectPage: m.Component<ProjectPageAttrs, ProjectPageState> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    return m(Sublayout, {
      class: 'ProjectPage',
      title: 'Project',
      showNewProposalButton: false,
    }, [
      m('h1', DummyProjectData.ProjectTitle),
      m('.project-metadata', [
        // m(ChainIndicator, { chain: app.activeChainId() }),
        m(User, { user: project.author }),
        // m(CWTag, { label: project.createdAt }),
        // m(CWTag, { label: project.deadline.asBlocks }),
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
          m(FaceliftButton, {
            intent: ButtonIntent.Primary,
            label: 'Contribute to this project',
            onclick: () => true,
          })
        ])
      ]),
      m('.project-about', [
        m('h2', 'About'),
        m(QuillFormattedText, {
          doc: DummyProjectData.ProjectDescription
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