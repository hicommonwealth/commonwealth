/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import app from 'state';
import ProjectCard, { ProjectCardSize } from './project_card';
import { DummyProject } from './dummy_project';

export default class ExplorePage
  implements m.ClassComponent<{ project: Project }>
{
  getExploreProjects(): Project[] {
    return new Array(5).fill(DummyProject);
    // return (
    //   app.projects.store
    //     .getAll()
    //     // TODO: Better momentjs-native sorting
    //     .sort((a, b) => (a.deadline.isBefore(b.deadline) ? -1 : 1))
    // );
  }

  view(vnode) {
    console.log(this.getExploreProjects());
    const exploreProjects = this.getExploreProjects().map((project) => (
      <ProjectCard project={project} size={ProjectCardSize.Large} />
    ));

    return (
      <div class="ExplorePage">
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
        <div class="projects-listing">{exploreProjects}</div>
        {/* TODO: Build in infinite scroll? */}
      </div>
    );
  }
}
