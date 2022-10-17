/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { Project } from 'models';
import app from 'state';
import { Spinner } from 'construct-ui';
import Web3 from 'web3';
import ProjectCard, { ProjectCardSize } from './project_card';
import { ChainNetwork } from '../../../../../../common-common/src/types';

export default class YourPage
  implements m.ClassComponent<{ currentBlockNum: number }>
{
  // TODO v2: These counts will be used for pagination or scroll
  private totalActiveProjects = 0;
  private totalEndedProjects = 0;
  private supportedProjectsDisplayed = 6;
  private endedProjectsDisplayed = 6;

  // TODO v2: Ended projects will be omitted from supported & authored projects,
  // which will be scoped to Active (vs Inactive)
  getAllUserProjects(): Project[] {
    const allUserProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter(
          (project) =>
            project.isAuthor(address, chain.id) ||
            project.isBacker(address, chain.id) ||
            project.isCurator(address, chain.id)
        )
        .forEach((project) => allUserProjects.push(project));
    });
    return allUserProjects;
  }

  getActiveProjects(currentBlockNum): Project[] {
    const activeProjects = this.getAllUserProjects().filter(
      (p: Project) => !p.isEnded(currentBlockNum)
    );
    this.totalActiveProjects = activeProjects.length;
    return activeProjects.sort((a, b) => a.createdAt.diff(b.createdAt));
    // .slice(0, this.supportedProjectsDisplayed);
  }

  getEndedProjects(currentBlockNum) {
    const endedProjects = this.getAllUserProjects().filter((p: Project) =>
      p.isEnded(currentBlockNum)
    );
    this.totalEndedProjects = endedProjects.length;
    return endedProjects.sort((a, b) => a.createdAt.diff(b.createdAt));
    // .slice(0, this.endedProjectsDisplayed);
  }

  view(vnode) {
    if (!app.isLoggedIn()) {
      m.route.set(`/projects/explore`);
      return;
    }
    if (!app.projects.initialized()) {
      return (
        <div class="YourPage">
          <Spinner active={true} fill={true} size="xl" />
        </div>
      );
    }

    const userProjects = this.getActiveProjects(
      vnode.attrs.currentBlockNum
    ).map((project) => (
      <ProjectCard project={project} size={ProjectCardSize.Large} />
    ));

    // web3.eth.getBlock().then(());

    return (
      <div class="YourPage">
        <div class="projects-listing">{userProjects}</div>
      </div>
    );
  }
}
