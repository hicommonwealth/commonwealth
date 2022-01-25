import 'pages/crowdfund/project_page.scss';

import m from 'mithril';
// import SearchBar from '../../components/search_bar';
// import { ButtonIntent, FaceliftButton } from '../../components/component_kit/buttons';
import QuillFormattedText from '../../components/quill_formatted_text';
// import User from '../../components/widgets/user';
import { DummyProjectData } from './project_card';
import { Project } from './index';
import Sublayout from '../../sublayout';

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
      // m('.project-metadata', [
      //  m('')
      // ])
      m('h2', 'About'),
      m(QuillFormattedText, {
        doc: DummyProjectData.ProjectDescription
      }),
      m('hr'),
      m('h2', 'Backers')
      // m(CWTable, {
      //  className: 'project-backers'm
      //  entries: project.backers.map((backer) => {
      //    m('.backer-row', [
      //      m(User),
      //      m('.contribution', backer.contribution)
      //     ])
      //  })
      // })
    ]);
  }
}

export default ProjectPage;