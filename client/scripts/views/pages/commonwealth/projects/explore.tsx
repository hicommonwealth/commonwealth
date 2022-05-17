/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import ProjectCard, { ProjectCardSize } from './project_card';

export default class ExploreProjectsPage
  implements m.ClassComponent<{ project: Project }>
{
  private filteredProjects: Project[];

  view(vnode) {
    this.filteredProjects = vnode.attrs.projects;
    // .filter();

    const ProjectListing = this.filteredProjects.map((project) => (
      <ProjectCard project={project} size={ProjectCardSize.Large} />
    ));

    return (
      <div class="ExploreProjectsPage">
        <CWText type="h1">Active Projects</CWText>
        {/* TODO: Implement projects filter */}
        {/* <div class="projects-filter"> */}
        {/* <CWText type="h3">Show me projects from</CWText> */}
        {/* Dropdown community filter updates filteredProjects */}
        {/* <CWText type="h3">created by</CWText> */}
        {/* Dropdown address filter updates filteredProjects */}
        {/* <CWText type="h3">about</CWText> */}
        {/* Dropdown tags filter updates filteredProjects */}
        {/* </div> */}
        {/* <hr /> */}
        {/* Sorted by toggle should sort filteredProjects in place */}
        <div class="projects-listing">{ProjectListing}</div>
      </div>
    );
  }
}
