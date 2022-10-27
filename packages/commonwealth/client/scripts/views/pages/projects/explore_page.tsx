/* @jsx m */

import m from 'mithril';
import app from 'state';
import { Spinner } from 'construct-ui';
import ProjectCard from './project_card/index';

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
      .filter((project) =>
        app.activeChainId() ? project.chainId === app.activeChainId() : true
      )
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
