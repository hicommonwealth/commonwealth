/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from '.';
import ProjectCard, { ProjectCardSize } from './project_card';

export default class YourProjectsPage
  implements m.ClassComponent<{ projects: Project[] }>
{
  view(vnode) {
    const { projects } = vnode.attrs;
    const currentProjects = projects
      // .filter((project) => null)
      .map((project) => {
        return m(ProjectCard, { project, size: ProjectCardSize.Large });
      });
    const previousProjects = projects
      // .filter((project) => null)
      .map((project) => {
        return m(ProjectCard, { project, size: ProjectCardSize.Medium });
      });
    return (
      <div class="YourProjectsPage">
        <CWText type="h1">Current Projects</CWText>
        <div class="projects-listing">{currentProjects}</div>
        <CWText type="h1">Previous Projects</CWText>
        <div class="projects-listing">{previousProjects}</div>
      </div>
    );
  }
}
