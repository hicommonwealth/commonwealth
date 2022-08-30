/* @jsx m */

import m from 'mithril';
import { Project } from 'models';
import app from 'state';
import { Spinner } from 'construct-ui';
import ProjectCard from './project_card';

export default class ExplorePage
  implements m.ClassComponent<{ currentBlockNum: number }>
{
  view(vnode) {
    const { currentBlockNum } = vnode.attrs;
    if (!app.projects.initialized()) {
      return (
        <div class="ExplorePage">
          <Spinner active={true} fill={true} size="xl" />
        </div>
      );
    }
    const exploreProjects = app.projects.store
      .getAll()
      .map((project) => (
        <ProjectCard project={project} currentBlockNum={currentBlockNum} />
      ));

    return (
      // TODO v2: Filters & tag buttons
      <div class="ExplorePage">
        <div class="projects-listing">{exploreProjects}</div>
      </div>
    );
  }
}
