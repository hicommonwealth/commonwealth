/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import projects, { Project } from '.';
import ProjectCard, { ProjectCardSize } from './project_card';

export default class BackedProjectsPage
  implements m.ClassComponent<{ backedProjects: Project[] }>
{
  view(vnode) {
    const { backedProjects } = vnode.attrs;
    const currentProjects = backedProjects
      // .filter()
      .map((project) => (
        <ProjectCard project={project} size={ProjectCardSize.Large} />
      ));
    const previousProjects = backedProjects
      // .filter()
      .map((project) => (
        <ProjectCard project={project} size={ProjectCardSize.Medium} />
      ));
    return (
      <div class="BackedProjectsPage">
        <CWText type="h1">Currently Backing</CWText>
        <div class="projects-listing">{currentProjects}</div>
        <CWText type="h1">Past Contributions</CWText>
        <div class="projects-listing">{previousProjects}</div>
      </div>
    );
  }
}
