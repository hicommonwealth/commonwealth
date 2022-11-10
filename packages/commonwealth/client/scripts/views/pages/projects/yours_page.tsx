/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';

import { Project } from 'models';
import ProjectCard from './project_card/index';
import { ProjectCardSize } from './types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

export default class YoursPage
  implements
    m.ClassComponent<{ currentBlockNum: number; userProjects: Project[] }>
{
  // TODO v2: These counts will be used for pagination or scroll
  private totalActiveProjects = 0;
  private totalEndedProjects = 0;
  private supportedProjectsDisplayed = 6;
  private endedProjectsDisplayed = 6;

  // TODO v2: Ended projects will be omitted from supported & authored projects,
  // which will be scoped to Active (vs Inactive

  // getActiveProjects(currentBlockNum): Project[] {
  //   const activeProjects = this.getAllUserProjects().filter(
  //     (p: Project) => !p.isEnded(currentBlockNum)
  //   );
  //   this.totalActiveProjects = activeProjects.length;
  //   return activeProjects.sort((a, b) => a.createdAt.diff(b.createdAt));
  //   // .slice(0, this.supportedProjectsDisplayed);
  // }

  // getEndedProjects(currentBlockNum) {
  //   const endedProjects = this.getAllUserProjects().filter((p: Project) =>
  //     p.isEnded(currentBlockNum)
  //   );
  //   this.totalEndedProjects = endedProjects.length;
  //   return endedProjects.sort((a, b) => a.createdAt.diff(b.createdAt));
  //   // .slice(0, this.endedProjectsDisplayed);
  // }

  view(vnode) {
    if (!app.isLoggedIn()) {
      m.route.set(`/projects/explore`);
      return;
    }

    if (!app.projects.initialized()) {
      return <CWSpinner />;
    }

    const userProjects = vnode.attrs.userProjects.map((project) => (
      <ProjectCard project={project} size={ProjectCardSize.Large} />
    ));

    return (
      <div class="YoursPage">
        <div class="projects-listing">{userProjects}</div>
      </div>
    );
  }
}
