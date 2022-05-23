/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import ProjectCard, { ProjectCardSize } from './project_card';

export default class YourPage implements m.ClassComponent {
  // private supportedProjects: Project[];
  // private userProjects: Project[];

  private userProjectsDisplayed = 6;
  private supportedProjectsDisplayed = 6;
  private endedProjectsDisplayed = 6;

  getUserProjects(): Project[] {
    const allProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter((project) => project.isAuthor(address, chain))
        .forEach((project) => allProjects.push(project));
    });
    // TODO filter by current
    return allProjects;
  }

  getSupportedProjects(): Project[] {
    const allProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter(
          (project) =>
            project.isBacker(address, chain) ||
            project.isCurator(address, chain)
        )
        .forEach((project) => allProjects.push(project));
    });
    // TODO filter by current
    return allProjects;
  }

  getEndedProjects() {
    // TODO
    return [];
  }

  view() {
    if (!app.isLoggedIn()) {
      m.route.set(`/projects/explore`);
    }
    // TODO: Consider including in get fns above
    const userProjectCards: JSX.Element[] = this.getUserProjects().map(
      (project) => (
        <ProjectCard project={project} size={ProjectCardSize.Large} />
      )
    );
    const supportedProjectCards: JSX.Element[] =
      this.getSupportedProjects().map((project) => (
        <ProjectCard project={project} size={ProjectCardSize.Medium} />
      ));
    const endedProjectCards: JSX.Element[] = this.getEndedProjects().map(
      (project) => (
        <ProjectCard project={project} size={ProjectCardSize.Small} />
      )
    );

    console.log('here');
    return (
      <div class="YourPage">
        <CWText type="h1">Your Projects</CWText>
        <div class="projects-listing">
          {userProjectCards}
          <CWButton buttonType="secondary" label="Manage" />
        </div>
        <CWText type="h1">Backed and Curated</CWText>
        <div class="projects-listing">
          {supportedProjectCards}
          <CWButton buttonType="secondary" label="Show More" />
        </div>
        <CWText type="h1">Ended Projects</CWText>
        <div class="projects-listing">
          {endedProjectCards}
          <CWButton buttonType="secondary" label="Show More" />
        </div>
      </div>
    );
  }
}
