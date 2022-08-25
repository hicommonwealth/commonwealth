/* @jsx m */

import m from 'mithril';
import { Project } from 'models';
import app from 'state';
import ProjectCard, { ProjectCardSize } from './project_card';
import { createNewDummyProject } from './dummy_project';

export default class ExplorePage
  implements m.ClassComponent<{ project: Project }>
{
  getDummyExploreProjects(): Project[] {
    return [
      createNewDummyProject({}),
      createNewDummyProject({ isAuthor: true }),
      createNewDummyProject({ isBacker: true }),
      createNewDummyProject({ isCurator: true }),
      createNewDummyProject({ isFailed: true }),
      createNewDummyProject({ isSucceeded: true }),
    ];
    // return (
    //   app.projects.store
    //     .getAll()
    //     // TODO: Better momentjs-native sorting
    //     .sort((a, b) => (a.deadline.isBefore(b.deadline) ? -1 : 1))
    // );
  }

  view(vnode) {
    const exploreProjects = app.projects.store
      .getAll()
      .map((project) => (
        <ProjectCard project={project} size={ProjectCardSize.Large} />
      ));

    console.log({ exploreProjects });

    return (
      <div class="ExplorePage">
        {/* TODO Graham 6-27-22 v2: Implement projects filter */}
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
