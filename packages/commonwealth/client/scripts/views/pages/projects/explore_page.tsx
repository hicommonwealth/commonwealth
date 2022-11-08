/* @jsx m */

import m from 'mithril';
import app from 'state';
import ProjectCard from './project_card/index';
import { PageLoading } from '../loading';

export default class ExplorePage
  implements m.ClassComponent<{ currentBlockNum: number }>
{
  view(vnode) {
    const { currentBlockNum } = vnode.attrs;

    if (!app.projects.initialized()) {
      return <PageLoading />;
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
