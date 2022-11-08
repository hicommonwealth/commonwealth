/* @jsx m */

import m from 'mithril';
import app from 'state';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ProjectCard from './project_card/index';

export default class ExplorePage
  implements m.ClassComponent<{ currentBlockNum: number }>
{
  view(vnode) {
    const { currentBlockNum } = vnode.attrs;
    if (!app.projects.initialized()) {
      return <CWSpinner />;
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
